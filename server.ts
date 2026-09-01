import { createServer, type IncomingMessage } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, type WebSocket } from 'ws';
import { ensureArcadeTables } from './src/server/arcade/migrate';
import { ensureBagOrderTables } from './src/server/bag-order/migrate';
import { ensureGachaTables } from './src/server/gacha/migrate';
import { snapshotRanks } from './src/server/gacha/rank';
import { expirePendingBagOrders } from './src/server/bag-order/bag-order-service';
import { cleanupExpiredLocks, getBoxState } from './src/server/box/box-service';
import { boxWsHub } from './src/server/box/box-ws-hub';
import { ensureMallTables } from './src/server/mall-migrate';

const dev = process.env.NODE_ENV !== 'production';
const port = Number(process.env.PORT || 3001);
const hostname = process.env.HOSTNAME || (dev ? 'localhost' : '0.0.0.0');

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function main() {
  await ensureMallTables();
  await ensureArcadeTables();
  await ensureBagOrderTables();
  await ensureGachaTables();
  await app.prepare();

  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || '', true);
      if (parsedUrl.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
      }
      await handle(req, res, parsedUrl);
    } catch (error) {
      console.error('Request handler error:', error);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const { pathname, query } = parse(req.url || '', true);
    if (pathname !== '/ws/bag') {
      socket.destroy();
      return;
    }

    const bagId = String(query.bagId || '').trim();
    if (!bagId) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req, bagId);
    });
  });

  wss.on(
    'connection',
    async (ws: WebSocket, _req: IncomingMessage, bagId: string) => {
      boxWsHub.add(bagId, ws);
      try {
        const state = await getBoxState(bagId);
        if (state) {
          ws.send(JSON.stringify({ type: 'state:snapshot', data: state }));
        }
      } catch (error) {
        console.error('WS snapshot error:', error);
      }

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(String(raw));
          if (msg?.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch {
          // ignore malformed messages
        }
      });

      const remove = () => boxWsHub.remove(bagId, ws);
      ws.on('close', remove);
      ws.on('error', remove);
    },
  );

  setInterval(() => {
    cleanupExpiredLocks().catch((error) => {
      console.error('Lock cleanup error:', error);
    });
    expirePendingBagOrders().catch((error) => {
      console.error('Bag order expire error:', error);
    });
  }, 10_000);

  snapshotRanks().catch((error) => {
    console.error('Initial rank snapshot error:', error);
  });
  setInterval(() => {
    snapshotRanks().catch((error) => {
      console.error('Rank snapshot error:', error);
    });
  }, 10 * 60 * 1000);

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket ws://${hostname}:${port}/ws/bag?bagId=...`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
