import type { WebSocket } from 'ws';
import type { BoxWsMessage } from './types';

type Room = Set<WebSocket>;

class BoxWsHub {
  private rooms = new Map<string, Room>();

  add(bagId: string, ws: WebSocket) {
    const roomKey = this.roomKey(bagId);
    if (!this.rooms.has(roomKey)) this.rooms.set(roomKey, new Set());
    this.rooms.get(roomKey)!.add(ws);
  }

  remove(bagId: string, ws: WebSocket) {
    const room = this.rooms.get(this.roomKey(bagId));
    if (!room) return;
    room.delete(ws);
    if (!room.size) this.rooms.delete(this.roomKey(bagId));
  }

  broadcast(bagId: string, message: BoxWsMessage) {
    const room = this.rooms.get(this.roomKey(bagId));
    if (!room?.size) return;
    const payload = JSON.stringify(message);
    for (const ws of room) {
      if (ws.readyState === ws.OPEN) ws.send(payload);
    }
  }

  snapshot(bagId: string, data: BoxWsMessage extends { type: 'state:snapshot'; data: infer D } ? D : never) {
    this.broadcast(bagId, { type: 'state:snapshot', data });
  }

  private roomKey(bagId: string) {
    return `bag:${bagId}`;
  }
}

export const boxWsHub = new BoxWsHub();
