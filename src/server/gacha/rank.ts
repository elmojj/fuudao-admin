import { query } from '../db';
import type { RankType } from './types';
import { getNextMondayReset, getSeasonKey, getWeekKey } from './utils';

const RANK_LIMITS: Record<RankType, number> = {
  active: 50,
  lucky: 50,
  score: 100,
};

export async function resetWeeklyStatsIfNeeded() {
  const weekKey = getWeekKey();
  await query(
    `UPDATE app_user
     SET week_draws = 0,
         week_task_points = 0,
         week_max_lucky = 0,
         week_lucky_at = NULL,
         week_key = $1,
         updated_at = NOW()
     WHERE week_key IS DISTINCT FROM $1`,
    [weekKey],
  );
}

export async function snapshotRanks() {
  await resetWeeklyStatsIfNeeded();

  const weekKey = getWeekKey();
  const seasonKey = getSeasonKey();

  await snapshotRankType('active', weekKey);
  await snapshotRankType('lucky', weekKey);
  await snapshotRankType('score', seasonKey);
}

async function snapshotRankType(rankType: RankType, periodKey: string) {
  const limit = RANK_LIMITS[rankType];

  await query(
    `DELETE FROM gacha_rank_snapshot WHERE rank_type = $1 AND period_key = $2`,
    [rankType, periodKey],
  );

  let sql = '';
  if (rankType === 'active') {
    sql = `
      SELECT u.id AS user_id,
             (u.week_draws + u.week_task_points)::bigint AS score,
             u.nickname, u.avatar, u.equipped_title AS title
      FROM app_user u
      WHERE (u.week_draws + u.week_task_points) > 0
      ORDER BY score DESC, u.id ASC
      LIMIT $1`;
  } else if (rankType === 'lucky') {
    sql = `
      SELECT u.id AS user_id,
             u.week_max_lucky::bigint AS score,
             u.nickname, u.avatar, u.equipped_title AS title,
             u.week_lucky_at
      FROM app_user u
      WHERE u.week_max_lucky > 0
      ORDER BY u.week_max_lucky DESC, u.week_lucky_at ASC NULLS LAST, u.id ASC
      LIMIT $1`;
  } else {
    sql = `
      SELECT u.id AS user_id,
             u.season_score::bigint AS score,
             u.nickname, u.avatar, u.equipped_title AS title
      FROM app_user u
      WHERE u.season_score > 0
      ORDER BY u.season_score DESC, u.id ASC
      LIMIT $1`;
  }

  const res = await query(sql, [limit]);
  for (let i = 0; i < res.rows.length; i++) {
    const row = res.rows[i];
    await query(
      `INSERT INTO gacha_rank_snapshot
       (rank_type, period_key, user_id, rank, score, nickname, avatar, title)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        rankType,
        periodKey,
        row.user_id,
        i + 1,
        row.score,
        row.nickname,
        row.avatar,
        row.title,
      ],
    );
  }
}

async function computeMyRank(
  userId: string,
  rankType: RankType,
  periodKey: string,
) {
  if (rankType === 'active') {
    const res = await query(
      `WITH ranked AS (
         SELECT id,
                ROW_NUMBER() OVER (
                  ORDER BY (week_draws + week_task_points) DESC, id ASC
                ) AS rank,
                (week_draws + week_task_points)::bigint AS score
         FROM app_user
         WHERE (week_draws + week_task_points) > 0
       )
       SELECT rank, score FROM ranked WHERE id = $1`,
      [userId],
    );
    if (!res.rowCount) return null;
    return {
      rank: Number(res.rows[0].rank),
      score: Number(res.rows[0].score),
    };
  }

  if (rankType === 'lucky') {
    const res = await query(
      `WITH ranked AS (
         SELECT id,
                ROW_NUMBER() OVER (
                  ORDER BY week_max_lucky DESC, week_lucky_at ASC NULLS LAST, id ASC
                ) AS rank,
                week_max_lucky::bigint AS score
         FROM app_user
         WHERE week_max_lucky > 0
       )
       SELECT rank, score FROM ranked WHERE id = $1`,
      [userId],
    );
    if (!res.rowCount) return null;
    return {
      rank: Number(res.rows[0].rank),
      score: Number(res.rows[0].score),
    };
  }

  const res = await query(
    `WITH ranked AS (
       SELECT id,
              ROW_NUMBER() OVER (ORDER BY season_score DESC, id ASC) AS rank,
              season_score::bigint AS score
       FROM app_user
       WHERE season_score > 0
     )
     SELECT rank, score FROM ranked WHERE id = $1`,
    [userId],
  );
  if (!res.rowCount) return null;
  return {
    rank: Number(res.rows[0].rank),
    score: Number(res.rows[0].score),
  };
}

export async function getRankList(
  rankType: RankType,
  page: number,
  size: number,
  userId?: string,
) {
  const periodKey =
    rankType === 'score' ? getSeasonKey() : getWeekKey();
  const limit = Math.min(size, RANK_LIMITS[rankType]);
  const offset = (page - 1) * limit;

  const countRes = await query(
    `SELECT COUNT(*)::int AS total
     FROM gacha_rank_snapshot
     WHERE rank_type = $1 AND period_key = $2`,
    [rankType, periodKey],
  );
  const total = Number(countRes.rows[0]?.total ?? 0);

  const res = await query(
    `SELECT rank, user_id, nickname, avatar, title, score, snapshot_at
     FROM gacha_rank_snapshot
     WHERE rank_type = $1 AND period_key = $2
     ORDER BY rank ASC
     LIMIT $3 OFFSET $4`,
    [rankType, periodKey, limit, offset],
  );

  const snapshotAt =
    res.rows[0]?.snapshot_at
      ? new Date(res.rows[0].snapshot_at).toISOString()
      : new Date().toISOString();

  const myRank = userId
    ? await computeMyRank(userId, rankType, periodKey)
    : null;

  return {
    type: rankType,
    periodKey,
    resetAt: rankType === 'score' ? '' : getNextMondayReset(),
    items: res.rows.map((row) => ({
      rank: Number(row.rank),
      userId: String(row.user_id),
      nickname: String(row.nickname || '用户'),
      avatar: String(row.avatar || ''),
      title: row.title ? String(row.title) : undefined,
      score: Number(row.score),
    })),
    myRank,
    snapshotAt,
    total,
  };
}
