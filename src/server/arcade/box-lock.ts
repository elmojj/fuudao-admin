import {
  cleanupExpiredLocks as cleanupBoxLocks,
  getBoxState,
  lockBoxSeat,
  unlockBoxSeat,
  verifyUserBoxLock,
} from '../box/box-service';
import { query } from '../db';

export { cleanupExpiredLocks } from '../box/box-service';

export async function lockBox(params: {
  bagId: string;
  indexNo: number;
  userId: string;
  clientIp: string;
}) {
  const result = await lockBoxSeat({
    bagId: params.bagId,
    boxNo: params.indexNo,
    userId: params.userId,
    clientIp: params.clientIp,
  });
  if ('code' in result && !('state' in result)) {
    return { error: result.message };
  }
  const state = result.state;
  if (!state) return { error: '锁盒失败' };
  const lock = state.locks.find((item) => item.boxNo === params.indexNo);
  return {
    lockId: `${params.bagId}:${params.indexNo}`,
    bagId: params.bagId,
    indexNo: params.indexNo,
    expiresAt: lock?.lockedAt,
  };
}

export async function unlockBox(params: {
  bagId: string;
  indexNo: number;
  userId: string;
}) {
  const result = await unlockBoxSeat({
    bagId: params.bagId,
    boxNo: params.indexNo,
    userId: params.userId,
  });
  if ('code' in result && !('state' in result)) {
    return { error: result.message };
  }
  return { lockId: `${params.bagId}:${params.indexNo}` };
}

export async function verifyUserLock(
  bagId: string,
  indexNo: number,
  userId: string,
) {
  return verifyUserBoxLock(bagId, indexNo, userId);
}

export async function listBoxLocks(bagId: string) {
  await cleanupBoxLocks(bagId);
  const state = await getBoxState(bagId);
  if (!state) return [];
  return state.locks.map((lock) => ({
    lockId: `${bagId}:${lock.boxNo}`,
    bagId,
    indexNo: lock.boxNo,
    userId: lock.userId,
    nickname: lock.userName || '',
    lockedAt: lock.lockedAt,
    expiresAt: lock.lockedAt,
  }));
}

export async function getBoxGridState(bagId: string) {
  const state = await getBoxState(bagId);
  if (!state) return null;

  const bagRes = await query('SELECT total_package FROM bag WHERE id = $1', [
    bagId,
  ]);
  const total = Number(bagRes.rows[0]?.total_package || 0);
  const sold = new Set(state.soldBoxes);
  const locks = new Map(state.locks.map((lock) => [lock.boxNo, lock.userId]));

  const boxes = [];
  for (let i = 1; i <= total; i += 1) {
    let boxState: 'available' | 'locked' | 'taken' = 'available';
    if (sold.has(i)) boxState = 'taken';
    else if (locks.has(i)) boxState = 'locked';
    boxes.push({
      indexNo: i,
      state: boxState,
      lockedBy: locks.get(i) || null,
    });
  }

  return { bagId, total, boxes };
}
