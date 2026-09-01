import type { PoolClient } from 'pg';
import { query } from '../db';
import { getSeasonKey, getSeasonWeek } from './utils';

export async function grantScore(
  client: PoolClient,
  userId: string,
  delta: number,
  source: string,
  refId?: string,
): Promise<number> {
  const res = await client.query(
    `UPDATE app_user
     SET total_score = total_score + $2,
         season_score = season_score + $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING total_score`,
    [userId, delta],
  );
  const balance = Number(res.rows[0]?.total_score ?? 0);
  await client.query(
    `INSERT INTO gacha_score_log (user_id, delta, balance, source, ref_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, delta, balance, source, refId || null],
  );
  return balance;
}

export async function getScoreBalance(userId: string) {
  const res = await query(
    `SELECT total_score, season_score, honor_score, season_key
     FROM app_user WHERE id = $1`,
    [userId],
  );
  const row = res.rows[0];
  return {
    totalScore: Number(row?.total_score ?? 0),
    seasonScore: Number(row?.season_score ?? 0),
    honorScore: Number(row?.honor_score ?? 0),
    seasonWeek: getSeasonWeek(),
    seasonKey: String(row?.season_key || getSeasonKey()),
  };
}

export async function getScoreLogs(
  userId: string,
  limit: number,
  offset: number,
) {
  const countRes = await query(
    `SELECT COUNT(*)::int AS total FROM gacha_score_log WHERE user_id = $1`,
    [userId],
  );
  const res = await query(
    `SELECT delta, balance, source, ref_id, created_at
     FROM gacha_score_log
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
      refId: row.ref_id ? String(row.ref_id) : undefined,
      createdAt: new Date(row.created_at).toISOString(),
    })),
    total: Number(countRes.rows[0]?.total ?? 0),
  };
}
