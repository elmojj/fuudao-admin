import { query } from '../db';
import { newId, toStr } from '../response';
import { boxWsHub } from './box-ws-hub';
import {
  BOX_ERROR,
  BOX_LOCK_TTL_MS,
  BOX_MAX_SELECT,
  type IBoxLockInfo,
  type IBoxState,
} from './types';

type BagMeta = {
  id: string;
  totalPackage: number;
  status: boolean;
  endTime: Date | null;
};

async function getBagMeta(bagId: string): Promise<BagMeta | null> {
  const res = await query(
    `SELECT id, total_package, status, end_time FROM bag WHERE id = $1`,
    [bagId],
  );
  if (!res.rowCount) return null;
  const row = res.rows[0];
  return {
    id: toStr(row.id),
    totalPackage: Number(row.total_package || 0),
    status: Boolean(row.status),
    endTime: row.end_time ? new Date(row.end_time) : null,
  };
}

function isBagActive(bag: BagMeta) {
  if (!bag.status) return false;
  if (bag.endTime && bag.endTime.getTime() < Date.now()) return false;
  return true;
}

async function getSoldBoxes(bagId: string): Promise<number[]> {
  const res = await query(
    `SELECT index_no FROM grab_bag_index WHERE grab_bag_id = $1
     UNION
     SELECT jsonb_array_elements_text(grab_bag_index)::int AS index_no
     FROM orders
     WHERE grab_bag_id = $1 AND order_kind = 'bag_pick' AND status = 2
     ORDER BY index_no ASC`,
    [bagId],
  );
  return res.rows.map((r) => Number(r.index_no));
}

async function getActiveLocks(bagId: string): Promise<IBoxLockInfo[]> {
  const res = await query(
    `SELECT bl.index_no, bl.user_id, bl.locked_at, u.nickname
     FROM box_lock bl
     LEFT JOIN app_user u ON u.id = bl.user_id
     WHERE bl.grab_bag_id = $1 AND bl.status = 1 AND bl.expires_at > NOW()
     ORDER BY bl.index_no ASC`,
    [bagId],
  );
  return res.rows.map((row) => ({
    boxNo: Number(row.index_no),
    userId: toStr(row.user_id),
    userName: toStr(row.nickname) || undefined,
    lockedAt: new Date(row.locked_at).toISOString(),
  }));
}

export async function getBoxState(bagId: string): Promise<IBoxState | null> {
  await cleanupExpiredLocks(bagId);
  const bag = await getBagMeta(bagId);
  if (!bag) return null;
  return {
    bagId,
    soldBoxes: await getSoldBoxes(bagId),
    locks: await getActiveLocks(bagId),
  };
}

export async function cleanupExpiredLocks(bagId?: string) {
  const conditions = ['status = 1', 'expires_at < NOW()'];
  const values: unknown[] = [];
  if (bagId) {
    conditions.push('grab_bag_id = $1');
    values.push(bagId);
  }
  const expired = await query(
    `UPDATE box_lock SET status = 2, updated_at = NOW()
     WHERE ${conditions.join(' AND ')}
     RETURNING grab_bag_id, index_no, user_id`,
    values,
  );
  for (const row of expired.rows) {
    const bid = toStr(row.grab_bag_id);
    boxWsHub.broadcast(bid, {
      type: 'box:unlock',
      data: { boxNo: Number(row.index_no), userId: toStr(row.user_id) },
    });
  }
}

async function countUserLocks(bagId: string, userId: string) {
  const res = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM box_lock
     WHERE grab_bag_id = $1 AND user_id = $2 AND status = 1 AND expires_at > NOW()`,
    [bagId, userId],
  );
  return Number(res.rows[0]?.count || 0);
}

export async function lockBoxSeat(params: {
  bagId: string;
  boxNo: number;
  userId: string;
  userName?: string;
  clientIp: string;
}) {
  await cleanupExpiredLocks(params.bagId);

  const bag = await getBagMeta(params.bagId);
  if (!bag || !isBagActive(bag)) {
    return { code: BOX_ERROR.BAG_INVALID, message: '福袋不存在或已结束' };
  }
  if (params.boxNo < 1 || params.boxNo > bag.totalPackage) {
    return { code: BOX_ERROR.BAG_INVALID, message: '格子编号无效' };
  }

  const soldBoxes = await getSoldBoxes(params.bagId);
  if (soldBoxes.includes(params.boxNo)) {
    return { code: BOX_ERROR.SOLD, message: '该格子已售出' };
  }

  const existing = await query(
    `SELECT * FROM box_lock
     WHERE grab_bag_id = $1 AND index_no = $2 AND status = 1 AND expires_at > NOW()`,
    [params.bagId, params.boxNo],
  );

  const now = new Date();
  const expiresAt = new Date(now.getTime() + BOX_LOCK_TTL_MS);

  if (existing.rowCount) {
    const lock = existing.rows[0];
    if (toStr(lock.user_id) !== params.userId) {
      return { code: BOX_ERROR.LOCKED_BY_OTHER, message: '该格子已被他人锁定' };
    }
    await query(
      `UPDATE box_lock SET locked_at = NOW(), expires_at = $2, updated_at = NOW()
       WHERE id = $1`,
      [lock.id, expiresAt],
    );
  } else {
    const userLockCount = await countUserLocks(params.bagId, params.userId);
    if (userLockCount >= BOX_MAX_SELECT) {
      return {
        code: BOX_ERROR.MAX_SELECT,
        message: `最多可选 ${BOX_MAX_SELECT} 个`,
      };
    }
    try {
      await query(
        `INSERT INTO box_lock (id, grab_bag_id, index_no, user_id, client_ip, status, locked_at, expires_at)
         VALUES ($1,$2,$3,$4,$5,1,NOW(),$6)`,
        [
          newId('lock'),
          params.bagId,
          params.boxNo,
          params.userId,
          params.clientIp,
          expiresAt,
        ],
      );
    } catch {
      return { code: BOX_ERROR.LOCKED_BY_OTHER, message: '该格子已被他人锁定' };
    }
  }

  const state = await getBoxState(params.bagId);
  if (!state) {
    return { code: BOX_ERROR.BAG_INVALID, message: '福袋不存在或已结束' };
  }

  const lockInfo = state.locks.find((l) => l.boxNo === params.boxNo)!;
  boxWsHub.broadcast(params.bagId, { type: 'box:lock', data: lockInfo });
  return { state };
}

export async function unlockBoxSeat(params: {
  bagId: string;
  boxNo: number;
  userId: string;
}) {
  await cleanupExpiredLocks(params.bagId);

  const existing = await query(
    `SELECT * FROM box_lock
     WHERE grab_bag_id = $1 AND index_no = $2 AND status = 1 AND expires_at > NOW()`,
    [params.bagId, params.boxNo],
  );

  if (existing.rowCount) {
    const lock = existing.rows[0];
    if (toStr(lock.user_id) !== params.userId) {
      return { code: 403, message: '无权解锁该格子', httpStatus: 403 };
    }
    await query(
      `UPDATE box_lock SET status = 2, updated_at = NOW() WHERE id = $1`,
      [lock.id],
    );
    boxWsHub.broadcast(params.bagId, {
      type: 'box:unlock',
      data: { boxNo: params.boxNo, userId: params.userId },
    });
  }

  const state = await getBoxState(params.bagId);
  if (!state) {
    return { code: BOX_ERROR.BAG_INVALID, message: '福袋不存在或已结束' };
  }
  return { state };
}

export async function markBoxesSold(bagId: string, boxNos: number[]) {
  if (!boxNos.length) return;
  await query(
    `UPDATE box_lock SET status = 3, updated_at = NOW()
     WHERE grab_bag_id = $1 AND index_no = ANY($2) AND status = 1`,
    [bagId, boxNos],
  );
  boxWsHub.broadcast(bagId, { type: 'box:sold', data: { boxNos } });
}

export async function verifyUserBoxLock(
  bagId: string,
  boxNo: number,
  userId: string,
) {
  await cleanupExpiredLocks(bagId);
  const res = await query(
    `SELECT id FROM box_lock
     WHERE grab_bag_id = $1 AND index_no = $2 AND user_id = $3
       AND status = 1 AND expires_at > NOW()`,
    [bagId, boxNo, userId],
  );
  return Boolean(res.rowCount);
}
