import { PoolClient } from 'pg';
import { markBoxesSold } from '../box/box-service';
import { boxWsHub } from '../box/box-ws-hub';
import { query, withTransaction } from '../db';
import { newId, toStr } from '../response';
import {
  BAG_ORDER_ERROR,
  BAG_ORDER_LOCK_KIND_ORDER,
  BAG_ORDER_PAY_WINDOW_MS,
  BAG_ORDER_STATUS,
  type IBagOrder,
  type IBagOrderOpenResult,
  type IWechatPayParams,
} from './types';

type BagRow = {
  id: string;
  package_name: string;
  cover: string;
  price: string | number;
  total_package: number;
  status: boolean;
  end_time: Date | null;
};

type BagItemRow = {
  id: string;
  item_name: string;
  item_cover: string;
  prob_rate: string | number;
  surplus_count: number;
  prize_score: number;
  rarity: string;
  level_name: string;
};

function statusToApi(status: number): IBagOrder['status'] {
  if (status === BAG_ORDER_STATUS.PAID) return 'PAID';
  if (status === BAG_ORDER_STATUS.CANCELLED) return 'CANCELLED';
  if (status === BAG_ORDER_STATUS.EXPIRED) return 'EXPIRED';
  return 'PENDING';
}

function generateOrderNo() {
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `BO${Date.now()}${suffix}`;
}

async function getBagRow(
  client: PoolClient | null,
  bagId: string,
): Promise<BagRow | null> {
  const runner = client
    ? (sql: string, params: unknown[]) => client.query(sql, params)
    : (sql: string, params: unknown[]) => query(sql, params);
  const res = await runner(`SELECT * FROM bag WHERE id = $1`, [bagId]);
  if (!res.rowCount) return null;
  return res.rows[0] as BagRow;
}

function isBagActive(bag: BagRow) {
  if (!bag.status) return false;
  if (bag.end_time && new Date(bag.end_time).getTime() < Date.now()) return false;
  return true;
}

async function getSoldBoxNos(bagId: string, client?: PoolClient) {
  const runner = client
    ? (sql: string, params: unknown[]) => client.query(sql, params)
    : (sql: string, params: unknown[]) => query(sql, params);

  const fromIndex = await runner(
    `SELECT index_no FROM grab_bag_index WHERE grab_bag_id = $1`,
    [bagId],
  );
  const fromPaid = await runner(
    `SELECT grab_bag_index FROM orders
     WHERE grab_bag_id = $1 AND order_kind = 'bag_pick' AND status = $2`,
    [bagId, BAG_ORDER_STATUS.PAID],
  );

  const sold = new Set<number>();
  for (const row of fromIndex.rows) sold.add(Number(row.index_no));
  for (const row of fromPaid.rows) {
    const boxNos = Array.isArray(row.grab_bag_index)
      ? row.grab_bag_index
      : JSON.parse(String(row.grab_bag_index || '[]'));
    for (const n of boxNos) sold.add(Number(n));
  }
  return sold;
}

function mapOrderRow(row: Record<string, unknown>): IBagOrder {
  const boxNos = Array.isArray(row.grab_bag_index)
    ? (row.grab_bag_index as number[])
    : JSON.parse(String(row.grab_bag_index || '[]'));

  const statusNum = Number(row.status);
  const result: IBagOrder = {
    id: toStr(row.id),
    orderNo: toStr(row.order_no),
    bagId: toStr(row.grab_bag_id),
    bagName: toStr(row.package_name),
    bagImage: toStr(row.cover) || undefined,
    boxNos: boxNos.map(Number),
    unitPrice: Number(row.price || 0),
    totalAmount: Number(row.total_price || 0),
    status: statusToApi(statusNum),
    expireAt: row.expire_at
      ? new Date(row.expire_at as string).toISOString()
      : '',
    createdAt: new Date(row.created_at as string).toISOString(),
  };
  if (row.paid_at) {
    result.paidAt = new Date(row.paid_at as string).toISOString();
  }
  return result;
}

async function fetchBagOrder(orderId: string, userId?: string) {
  const values: unknown[] = [orderId];
  let sql = `SELECT o.*, b.package_name, b.cover
    FROM orders o
    LEFT JOIN bag b ON b.id = o.grab_bag_id
    WHERE o.id = $1 AND o.order_kind = 'bag_pick'`;
  if (userId) {
    sql += ` AND o.buy_user_id = $2`;
    values.push(userId);
  }
  const res = await query(sql, values);
  return res.rows[0] || null;
}

async function broadcastLocks(bagId: string, boxNos: number[], userId: string) {
  const locks = await query(
    `SELECT bl.index_no, bl.user_id, bl.locked_at, u.nickname
     FROM box_lock bl
     LEFT JOIN app_user u ON u.id = bl.user_id
     WHERE bl.grab_bag_id = $1 AND bl.index_no = ANY($2) AND bl.status = 1`,
    [bagId, boxNos],
  );
  for (const row of locks.rows) {
    boxWsHub.broadcast(bagId, {
      type: 'box:lock',
      data: {
        boxNo: Number(row.index_no),
        userId: toStr(row.user_id),
        userName: toStr(row.nickname) || undefined,
        lockedAt: new Date(row.locked_at).toISOString(),
      },
    });
  }
}

function weightedPick(items: BagItemRow[]): BagItemRow {
  const available = items.filter((item) => Number(item.surplus_count) > 0);
  if (!available.length) throw new Error('赏品库存不足');
  const totalWeight = available.reduce(
    (sum, item) => sum + Number(item.prob_rate || 0),
    0,
  );
  let random = Math.random() * (totalWeight || available.length);
  for (const item of available) {
    random -= Number(item.prob_rate || 1);
    if (random <= 0) return item;
  }
  return available[available.length - 1]!;
}

async function loadBagItems(client: PoolClient, bagId: string) {
  const res = await client.query<BagItemRow>(
    `SELECT bi.*, il.level_name
     FROM bag_item bi
     LEFT JOIN item_level il ON il.id = bi.level_id
     WHERE bi.grab_bag_id = $1 AND bi.status = 1
     ORDER BY bi.sort ASC`,
    [bagId],
  );
  return res.rows;
}

export async function expireBagOrderIfNeeded(
  orderId: string,
): Promise<IBagOrder | null> {
  const row = await fetchBagOrder(orderId);
  if (!row) return null;
  if (Number(row.status) !== BAG_ORDER_STATUS.PENDING) {
    return mapOrderRow(row);
  }
  if (!row.expire_at || new Date(row.expire_at).getTime() > Date.now()) {
    return mapOrderRow(row);
  }
  return expireBagOrder(orderId);
}

async function expireBagOrder(orderId: string): Promise<IBagOrder | null> {
  const row = await fetchBagOrder(orderId);
  if (!row || Number(row.status) !== BAG_ORDER_STATUS.PENDING) {
    return row ? mapOrderRow(row) : null;
  }

  const boxNos: number[] = Array.isArray(row.grab_bag_index)
    ? row.grab_bag_index
    : JSON.parse(String(row.grab_bag_index || '[]'));

  await query(
    `UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1`,
    [orderId, BAG_ORDER_STATUS.EXPIRED],
  );

  const released = await query(
    `UPDATE box_lock SET status = 2, updated_at = NOW()
     WHERE order_id = $1 AND status = 1
     RETURNING grab_bag_id, index_no, user_id`,
    [orderId],
  );

  for (const lock of released.rows) {
    boxWsHub.broadcast(toStr(lock.grab_bag_id), {
      type: 'box:unlock',
      data: {
        boxNo: Number(lock.index_no),
        userId: toStr(lock.user_id),
      },
    });
  }

  const updated = await fetchBagOrder(orderId);
  return updated ? mapOrderRow(updated) : null;
}

export async function expirePendingBagOrders() {
  const res = await query(
    `SELECT id FROM orders
     WHERE order_kind = 'bag_pick' AND status = $1 AND expire_at < NOW()`,
    [BAG_ORDER_STATUS.PENDING],
  );
  for (const row of res.rows) {
    await expireBagOrder(toStr(row.id));
  }
}

export async function createBagOrder(params: {
  userId: string;
  bagId: string;
  boxNos: number[];
}) {
  const uniqueBoxNos = [...new Set(params.boxNos.map(Number))].filter(
    (n) => !Number.isNaN(n),
  );
  if (!uniqueBoxNos.length) {
    return { code: BAG_ORDER_ERROR.NO_BOXES, message: '请先选择格子' };
  }

  const orderId = newId('order');
  const orderNo = generateOrderNo();
  const expireAt = new Date(Date.now() + BAG_ORDER_PAY_WINDOW_MS);

  try {
    const order = await withTransaction(async (client) => {
      const bag = await getBagRow(client, params.bagId);
      if (!bag || !isBagActive(bag)) {
        throw Object.assign(new Error('福袋不存在或已结束'), {
          code: BAG_ORDER_ERROR.BAG_INVALID,
        });
      }

      const sold = await getSoldBoxNos(params.bagId, client);
      const unitPrice = Number(bag.price || 0);

      for (const boxNo of uniqueBoxNos) {
        if (boxNo < 1 || boxNo > Number(bag.total_package || 0)) {
          throw Object.assign(new Error('格子编号无效'), {
            code: BAG_ORDER_ERROR.BAG_INVALID,
          });
        }
        if (sold.has(boxNo)) {
          throw Object.assign(new Error('该格子已售出'), {
            code: BAG_ORDER_ERROR.SOLD,
          });
        }

        const lockRes = await client.query(
          `SELECT * FROM box_lock
           WHERE grab_bag_id = $1 AND index_no = $2 AND status = 1 AND expires_at > NOW()
           FOR UPDATE`,
          [params.bagId, boxNo],
        );
        if (!lockRes.rowCount) {
          throw Object.assign(new Error('请先锁定该格子'), {
            code: BAG_ORDER_ERROR.LOCKED_BY_OTHER,
          });
        }
        const lock = lockRes.rows[0];
        if (toStr(lock.user_id) !== params.userId) {
          throw Object.assign(new Error('该格子已被他人锁定'), {
            code: BAG_ORDER_ERROR.LOCKED_BY_OTHER,
          });
        }
      }

      const totalAmount = unitPrice * uniqueBoxNos.length;
      await client.query(
        `INSERT INTO orders
         (id, grab_bag_id, buy_user_id, total_count, total_price, price, status,
          grab_bag_index, order_no, expire_at, order_kind)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'bag_pick')`,
        [
          orderId,
          params.bagId,
          params.userId,
          uniqueBoxNos.length,
          totalAmount,
          unitPrice,
          BAG_ORDER_STATUS.PENDING,
          JSON.stringify(uniqueBoxNos),
          orderNo,
          expireAt,
        ],
      );

      for (const boxNo of uniqueBoxNos) {
        await client.query(
          `UPDATE box_lock
           SET lock_kind = $2, order_id = $3, expires_at = $4, locked_at = NOW(), updated_at = NOW()
           WHERE grab_bag_id = $1 AND index_no = $5 AND user_id = $6 AND status = 1`,
          [
            params.bagId,
            BAG_ORDER_LOCK_KIND_ORDER,
            orderId,
            expireAt,
            boxNo,
            params.userId,
          ],
        );
      }

      return {
        id: orderId,
        orderNo,
        bagId: params.bagId,
        bagName: toStr(bag.package_name),
        bagImage: toStr(bag.cover) || undefined,
        boxNos: uniqueBoxNos,
        unitPrice,
        totalAmount,
        status: 'PENDING' as const,
        expireAt: expireAt.toISOString(),
        createdAt: new Date().toISOString(),
      };
    });

    await broadcastLocks(params.bagId, uniqueBoxNos, params.userId);
    return { order };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code: unknown }).code === 'number'
    ) {
      return {
        code: (error as { code: number }).code,
        message: error instanceof Error ? error.message : '创建订单失败',
      };
    }
    throw error;
  }
}

export async function getBagOrder(orderId: string, userId: string) {
  await expireBagOrderIfNeeded(orderId);
  const row = await fetchBagOrder(orderId, userId);
  if (!row) return null;
  return mapOrderRow(row);
}

export async function payBagOrder(orderId: string, userId: string) {
  const order = await expireBagOrderIfNeeded(orderId);
  if (!order) return { code: 404, message: '订单不存在' };
  if (order.id !== orderId) return { code: 404, message: '订单不存在' };

  const row = await fetchBagOrder(orderId, userId);
  if (!row) return { code: 404, message: '订单不存在' };

  const status = statusToApi(Number(row.status));
  if (status === 'EXPIRED') {
    return { code: 400, message: '订单已超时，不可支付' };
  }
  if (status === 'CANCELLED') {
    return { code: 400, message: '订单已取消，不可支付' };
  }
  if (status === 'PAID') {
    return { code: 400, message: '订单已支付，不可重复支付' };
  }
  if (status !== 'PENDING') {
    return { code: 400, message: '订单不可支付' };
  }

  const payParams: IWechatPayParams = {
    timeStamp: String(Math.floor(Date.now() / 1000)),
    nonceStr: newId('nonce'),
    package: `prepay_id=wx_${toStr(row.order_no)}`,
    signType: 'RSA',
    paySign: 'mock_sign',
  };

  return { payParams };
}

export async function completeBagOrderPayment(orderNo: string) {
  const res = await query(
    `SELECT * FROM orders WHERE order_no = $1 AND order_kind = 'bag_pick'`,
    [orderNo],
  );
  if (!res.rowCount) return { code: 404, message: '订单不存在' };
  const row = res.rows[0];
  if (Number(row.status) === BAG_ORDER_STATUS.PAID) {
    return { ok: true, orderId: toStr(row.id) };
  }
  if (Number(row.status) !== BAG_ORDER_STATUS.PENDING) {
    return { code: 400, message: '订单不可支付' };
  }
  if (row.expire_at && new Date(row.expire_at).getTime() < Date.now()) {
    await expireBagOrder(toStr(row.id));
    return { code: 400, message: '订单已超时' };
  }

  const bagId = toStr(row.grab_bag_id);
  const boxNos: number[] = Array.isArray(row.grab_bag_index)
    ? row.grab_bag_index
    : JSON.parse(String(row.grab_bag_index || '[]'));

  await query(
    `UPDATE orders SET status = $2, paid_at = NOW(), transaction_id = $3, updated_at = NOW()
     WHERE id = $1`,
    [row.id, BAG_ORDER_STATUS.PAID, `wx_${orderNo}`],
  );

  await markBoxesSold(bagId, boxNos);
  return { ok: true, orderId: toStr(row.id) };
}

export async function cancelBagOrder(orderId: string, userId: string) {
  const order = await expireBagOrderIfNeeded(orderId);
  if (!order) return { code: 404, message: '订单不存在' };

  const row = await fetchBagOrder(orderId, userId);
  if (!row) return { code: 404, message: '订单不存在' };

  const status = statusToApi(Number(row.status));
  if (status === 'EXPIRED') {
    return { code: 400, message: '订单已超时，不可取消' };
  }
  if (status !== 'PENDING') {
    return { code: 400, message: '仅待支付订单可取消' };
  }

  await query(
    `UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1`,
    [orderId, BAG_ORDER_STATUS.CANCELLED],
  );

  const released = await query(
    `UPDATE box_lock SET status = 2, updated_at = NOW()
     WHERE order_id = $1 AND status = 1
     RETURNING grab_bag_id, index_no, user_id`,
    [orderId],
  );

  for (const lock of released.rows) {
    boxWsHub.broadcast(toStr(lock.grab_bag_id), {
      type: 'box:unlock',
      data: {
        boxNo: Number(lock.index_no),
        userId: toStr(lock.user_id),
      },
    });
  }

  const updated = await fetchBagOrder(orderId, userId);
  return { order: updated ? mapOrderRow(updated) : null };
}

export async function openBagOrder(
  orderId: string,
  userId: string,
): Promise<{ result?: IBagOrderOpenResult; code?: number; message?: string }> {
  const existing = await query(
    `SELECT result_json FROM bag_order_open WHERE order_id = $1`,
    [orderId],
  );
  if (existing.rowCount) {
    return { result: existing.rows[0].result_json as IBagOrderOpenResult };
  }

  const row = await fetchBagOrder(orderId, userId);
  if (!row) return { code: 404, message: '订单不存在' };
  if (Number(row.status) !== BAG_ORDER_STATUS.PAID) {
    return { code: 400, message: '仅已支付订单可开赏' };
  }

  const bagId = toStr(row.grab_bag_id);
  const boxNos: number[] = Array.isArray(row.grab_bag_index)
    ? row.grab_bag_index
    : JSON.parse(String(row.grab_bag_index || '[]'));

  try {
    const result = await withTransaction(async (client) => {
      const items = await loadBagItems(client, bagId);
      const prizes: IBagOrderOpenResult['prizes'] = [];

      for (const boxNo of boxNos) {
        const picked = weightedPick(items);
        const indexId = newId('gbi');
        const cabinetId = newId('cabinet');

        await client.query(
          `INSERT INTO grab_bag_index
           (id, grab_bag_id, grab_bag_item_id, user_id, order_id, index_no, status)
           VALUES ($1,$2,$3,$4,$5,$6,1)`,
          [indexId, bagId, picked.id, userId, orderId, boxNo],
        );

        await client.query(
          `INSERT INTO order_lottery_result
           (order_id, grab_bag_item_id, grab_bag_index_id, index_no, item_name, item_cover)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [
            orderId,
            picked.id,
            indexId,
            boxNo,
            picked.item_name,
            picked.item_cover || '',
          ],
        );

        await client.query(
          `INSERT INTO user_prize_cabinet
           (id, user_id, grab_bag_id, grab_bag_item_id, order_id, grab_bag_index_id,
            index_no, prize_name, prize_photo, prize_score, rarity, ownership,
            is_shareable, prize_status, prize_category, unique_category)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'',FALSE,1,'','')`,
          [
            cabinetId,
            userId,
            bagId,
            picked.id,
            orderId,
            indexId,
            boxNo,
            picked.item_name,
            picked.item_cover || '',
            Number(picked.prize_score || 0),
            toStr(picked.rarity) || 'normal',
          ],
        );

        await client.query(
          `UPDATE bag_item SET send_count = send_count + 1,
           surplus_count = GREATEST(surplus_count - 1, 0), updated_at = NOW()
           WHERE id = $1`,
          [picked.id],
        );

        const itemIdx = items.findIndex((i) => i.id === picked.id);
        if (itemIdx >= 0) {
          items[itemIdx]!.surplus_count = Math.max(
            0,
            Number(items[itemIdx]!.surplus_count) - 1,
          );
        }

        prizes.push({
          boxNo,
          prizeName: toStr(picked.item_name),
          prizeImage: toStr(picked.item_cover) || undefined,
          grade: toStr(picked.level_name) || undefined,
        });
      }

      await client.query(
        `UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1`,
        [orderId, BAG_ORDER_STATUS.COMPLETED],
      );

      await client.query(
        `UPDATE app_user SET reward_total = reward_total + $2, buy_total = buy_total + $2,
         updated_at = NOW() WHERE id = $1`,
        [userId, boxNos.length],
      );

      const openResult: IBagOrderOpenResult = { orderId, boxNos, prizes };
      await client.query(
        `INSERT INTO bag_order_open (order_id, result_json) VALUES ($1, $2)`,
        [orderId, JSON.stringify(openResult)],
      );
      return openResult;
    });

    return { result };
  } catch (error) {
    const message = error instanceof Error ? error.message : '开赏失败';
    return { code: 400, message };
  }
}

export async function handleWechatPayNotify(body: Record<string, unknown>) {
  const orderNo = String(
    body.orderNo || body.out_trade_no || body.outTradeNo || '',
  ).trim();
  if (!orderNo) return { code: 400, message: '缺少订单号' };

  if (process.env.WECHAT_PAY_MOCK !== 'false') {
    return completeBagOrderPayment(orderNo);
  }

  return { code: 501, message: '微信支付回调未配置' };
}
