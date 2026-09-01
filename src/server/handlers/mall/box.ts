import {
  getBoxState,
  lockBoxSeat,
  unlockBoxSeat,
} from '../../box/box-service';
import { BOX_ERROR } from '../../box/types';
import { checkRateLimit, getClientIp } from '../../arcade/rate-limit';
import { query } from '../../db';
import { toStr } from '../../response';

async function getUserName(userId: string) {
  const res = await query('SELECT nickname FROM app_user WHERE id = $1', [
    userId,
  ]);
  return toStr(res.rows[0]?.nickname) || undefined;
}

export async function handleBagBoxState(params: Record<string, string>) {
  const bagId = params.bagId || '';
  if (!bagId) return { code: 1, message: 'bagId 不能为空' };
  const state = await getBoxState(bagId);
  if (!state) return { code: BOX_ERROR.BAG_INVALID, message: '福袋不存在或已结束' };
  return { state };
}

export async function handleBagBoxLock(
  userId: string,
  request: Request,
  body: Record<string, unknown>,
) {
  const clientIp = getClientIp(request);
  if (!checkRateLimit(`lock-ip:${clientIp}`, 4, 1000)) {
    return { code: 1, message: '操作过于频繁，请稍后再试' };
  }
  if (!checkRateLimit(`lock-user:${userId}`, 10, 1000)) {
    return { code: 1, message: '锁盒操作过于频繁，请稍后再试' };
  }

  const bagId = String(body.bagId || '');
  const boxNo = Number(body.boxNo);
  if (!bagId || Number.isNaN(boxNo)) {
    return { code: 1, message: '参数不完整' };
  }

  const userName = await getUserName(userId);
  return lockBoxSeat({ bagId, boxNo, userId, userName, clientIp });
}

export async function handleBagBoxUnlock(
  userId: string,
  body: Record<string, unknown>,
) {
  const bagId = String(body.bagId || '');
  const boxNo = Number(body.boxNo);
  if (!bagId || Number.isNaN(boxNo)) {
    return { code: 1, message: '参数不完整' };
  }
  return unlockBoxSeat({ bagId, boxNo, userId });
}
