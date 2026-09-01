import type { PoolClient } from 'pg';
import { query } from '../db';

export async function grantDrawChances(
  client: PoolClient,
  userId: string,
  delta: number,
  source: string,
): Promise<number> {
  const res = await client.query(
    `UPDATE app_user
     SET draw_chances = draw_chances + $2, updated_at = NOW()
     WHERE id = $1
     RETURNING draw_chances`,
    [userId, delta],
  );
  const balance = Number(res.rows[0]?.draw_chances ?? 0);
  await client.query(
    `INSERT INTO gacha_chance_log (user_id, delta, balance, source)
     VALUES ($1, $2, $3, $4)`,
    [userId, delta, balance, source],
  );
  return balance;
}

export async function getDrawChanceBalance(userId: string) {
  const res = await query(
    `SELECT draw_chances FROM app_user WHERE id = $1`,
    [userId],
  );
  const balance = Number(res.rows[0]?.draw_chances ?? 0);

  const usedRes = await query(
    `SELECT COALESCE(SUM(ABS(delta)), 0) AS used
     FROM gacha_chance_log
     WHERE user_id = $1 AND delta < 0 AND created_at::date = CURRENT_DATE`,
    [userId],
  );
  return {
    balance,
    todayUsed: Number(usedRes.rows[0]?.used ?? 0),
  };
}

export async function getDrawChanceLogs(
  userId: string,
  limit: number,
  offset: number,
) {
  const countRes = await query(
    `SELECT COUNT(*)::int AS total FROM gacha_chance_log WHERE user_id = $1`,
    [userId],
  );
  const res = await query(
    `SELECT delta, balance, source, created_at
     FROM gacha_chance_log
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return {
    items: res.rows.map((row) => ({
      delta: Number(row.delta),
      balance: Number(row.balance),
      source: String(row.source),
      createdAt: new Date(row.created_at).toISOString(),
    })),
    total: Number(countRes.rows[0]?.total ?? 0),
  };
}
