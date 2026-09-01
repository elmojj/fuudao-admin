import { query, withTransaction } from '../db';
import { grantDrawChances } from './chance';
import { ensureInviteCode } from './profile';

const INVITE_REWARD = 5;

export async function getInviteInfo(userId: string) {
  const inviteCode = await ensureInviteCode(userId);

  const invitedRes = await query(
    `SELECT COUNT(*)::int AS total FROM app_user WHERE invited_by = $1`,
    [userId],
  );
  const rewardRes = await query(
    `SELECT COALESCE(SUM(reward), 0)::int AS total
     FROM gacha_task_log
     WHERE user_id = $1 AND task_type = 'invite'`,
    [userId],
  );

  return {
    inviteCode,
    invitePath: `/pages/index/index?inviteCode=${inviteCode}`,
    totalInvited: Number(invitedRes.rows[0]?.total ?? 0),
    totalReward: Number(rewardRes.rows[0]?.total ?? 0),
  };
}

export async function bindInvite(
  userId: string,
  inviteCode: string,
): Promise<{ code?: number; message?: string; reward?: number }> {
  const code = String(inviteCode || '').trim().toUpperCase();
  if (!code) return { code: 1, message: '邀请码无效' };

  return withTransaction(async (client) => {
    const userRes = await client.query(
      `SELECT invited_by FROM app_user WHERE id = $1 FOR UPDATE`,
      [userId],
    );
    if (!userRes.rowCount) return { code: 401, message: '未授权' };
    if (userRes.rows[0].invited_by) {
      return { code: 1, message: '已绑定过邀请关系' };
    }

    const inviterRes = await client.query(
      `SELECT id FROM app_user WHERE invite_code = $1`,
      [code],
    );
    if (!inviterRes.rowCount) return { code: 1, message: '邀请码不存在' };

    const inviterId = String(inviterRes.rows[0].id);
    if (inviterId === userId) {
      return { code: 1, message: '不能邀请自己' };
    }

    await client.query(
      `UPDATE app_user SET invited_by = $2, updated_at = NOW() WHERE id = $1`,
      [userId, inviterId],
    );

    await client.query(
      `INSERT INTO gacha_task_log (user_id, task_type, task_date, reward)
       VALUES ($1, 'invite', CURRENT_DATE, $2)`,
      [userId, INVITE_REWARD],
    );
    await client.query(
      `INSERT INTO gacha_task_log (user_id, task_type, task_date, reward)
       VALUES ($1, 'invite', CURRENT_DATE, $2)`,
      [inviterId, INVITE_REWARD],
    );

    await grantDrawChances(client, userId, INVITE_REWARD, 'invite');
    await grantDrawChances(client, inviterId, INVITE_REWARD, 'invite');

    return { reward: INVITE_REWARD };
  });
}
