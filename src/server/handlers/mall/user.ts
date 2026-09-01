import { buildExtendedProfile } from '../../gacha/profile';
import { query } from '../../db';

export async function handleMallUserProfile(userId: string) {
  return buildExtendedProfile(userId);
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
