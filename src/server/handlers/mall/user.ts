import { query } from '../../db';
import { formatTime, toStr } from '../../response';

export async function handleMallUserProfile(userId: string) {
  const res = await query('SELECT * FROM app_user WHERE id = $1', [userId]);
  if (!res.rowCount) return null;
  const row = res.rows[0];
  return {
    id: toStr(row.id),
    nickname: toStr(row.nickname),
    avatar: toStr(row.avatar),
    phone: toStr(row.phone_number) || undefined,
    stats: {
      buyAmountTotal: Number(row.buy_amount_total || 0),
      buyTotal: Number(row.buy_total || 0),
      rewardTotal: Number(row.reward_total || 0),
    },
    createdAt: formatTime(row.created_at),
  };
}

export async function handleMallUserProfileUpdate(
  userId: string,
  body: Record<string, unknown>,
) {
  const fields: string[] = [];
  const values: unknown[] = [userId];
  let idx = 2;

  if (body.nickname !== undefined) {
    fields.push(`nickname = $${idx++}`);
    values.push(body.nickname);
  }
  if (body.avatar !== undefined) {
    fields.push(`avatar = $${idx++}`);
    values.push(body.avatar);
  }
  if (body.phone !== undefined || body.phoneNumber !== undefined) {
    fields.push(`phone_number = $${idx++}`);
    values.push(body.phone || body.phoneNumber);
  }
  if (!fields.length) return { error: '无更新字段' };

  fields.push('updated_at = NOW()');
  await query(
    `UPDATE app_user SET ${fields.join(', ')} WHERE id = $1`,
    values,
  );
  return handleMallUserProfile(userId);
}
