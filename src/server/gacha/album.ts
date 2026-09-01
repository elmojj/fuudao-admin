import { query, withTransaction } from '../db';
import { grantScore } from './score';
import { mapGachaItem } from './utils';
import { unlockTitle } from './profile';
import type { GachaItemRow } from './types';

export async function getAlbumSummary(userId: string) {
  const totalRes = await query(
    `SELECT COUNT(*)::int AS total FROM gacha_item WHERE status = 1`,
  );
  const collectedRes = await query(
    `SELECT COUNT(*)::int AS collected FROM gacha_collection WHERE user_id = $1`,
    [userId],
  );
  const seriesRes = await query(
    `SELECT series FROM gacha_collection_series WHERE user_id = $1`,
    [userId],
  );

  const totalItems = Number(totalRes.rows[0]?.total ?? 0);
  const collectedCount = Number(collectedRes.rows[0]?.collected ?? 0);
  const progress =
    totalItems > 0
      ? Math.round((collectedCount / totalItems) * 1000) / 10
      : 0;

  const bonus10 = await query(
    `SELECT 1 FROM gacha_score_log
     WHERE user_id = $1 AND source = 'album_bonus_10' LIMIT 1`,
    [userId],
  );
  const bonus30 = await query(
    `SELECT 1 FROM gacha_score_log
     WHERE user_id = $1 AND source = 'album_bonus_30' LIMIT 1`,
    [userId],
  );

  if (collectedCount >= 10 && !bonus10.rowCount) {
    await grantAlbumMilestone(userId, 10);
  }
  if (collectedCount >= 30 && !bonus30.rowCount) {
    await grantAlbumMilestone(userId, 30);
  }
  if (totalItems > 0 && collectedCount >= totalItems) {
    await unlockTitle(null, userId, 'full_album');
  }

  const bonus10After = await query(
    `SELECT 1 FROM gacha_score_log
     WHERE user_id = $1 AND source = 'album_bonus_10' LIMIT 1`,
    [userId],
  );
  const bonus30After = await query(
    `SELECT 1 FROM gacha_score_log
     WHERE user_id = $1 AND source = 'album_bonus_30' LIMIT 1`,
    [userId],
  );

  return {
    totalItems,
    collectedCount,
    progress,
    completedSeries: seriesRes.rows.map((r) => String(r.series)),
    bonuses: [
      {
        id: 'collect_10',
        label: '收集满 10 种',
        reward: '+100 积分',
        claimed: Boolean(bonus10After.rowCount),
      },
      {
        id: 'collect_30',
        label: '收集满 30 种',
        reward: '+500 积分',
        claimed: Boolean(bonus30After.rowCount),
      },
    ],
  };
}

async function grantAlbumMilestone(userId: string, milestone: 10 | 30) {
  const source = milestone === 10 ? 'album_bonus_10' : 'album_bonus_30';
  const points = milestone === 10 ? 100 : 500;
  const exists = await query(
    `SELECT 1 FROM gacha_score_log WHERE user_id = $1 AND source = $2 LIMIT 1`,
    [userId, source],
  );
  if (exists.rowCount) return;

  await withTransaction(async (client) => {
    await grantScore(client, userId, points, source);
  });
}

export async function getAlbumSeries(userId: string, series: string) {
  const itemsRes = await query(
    `SELECT i.*, c.count, c.first_at
     FROM gacha_item i
     LEFT JOIN gacha_collection c
       ON c.item_id = i.item_id AND c.user_id = $2
     WHERE i.series = $1 AND i.status = 1
     ORDER BY i.rarity DESC, i.item_id`,
    [series, userId],
  );

  const collected = itemsRes.rows.filter((r) => Number(r.count || 0) > 0).length;

  return {
    series,
    total: itemsRes.rowCount || 0,
    collected,
    items: itemsRes.rows.map((row) => ({
      item: mapGachaItem(row as GachaItemRow),
      owned: Number(row.count || 0) > 0,
      count: Number(row.count || 0),
      firstAt: row.first_at
        ? new Date(row.first_at).toISOString()
        : undefined,
    })),
  };
}

export async function getAlbumItems(
  userId: string,
  limit: number,
  offset: number,
) {
  const countRes = await query(
    `SELECT COUNT(*)::int AS total FROM gacha_collection WHERE user_id = $1`,
    [userId],
  );
  const res = await query(
    `SELECT c.count, c.first_at,
            i.item_id, i.name, i.rarity, i.rarity_score, i.score_value,
            i.series, i.series_total, i.image, i.animation
     FROM gacha_collection c
     JOIN gacha_item i ON i.item_id = c.item_id
     WHERE c.user_id = $1
     ORDER BY c.first_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );

  return {
    items: res.rows.map((row) => ({
      item: {
        itemId: row.item_id,
        name: row.name,
        rarity: row.rarity,
        rarityScore: row.rarity_score,
        scoreValue: row.score_value,
        series: row.series,
        seriesTotal: row.series_total,
        image: row.image || '',
        animation: row.animation,
      },
      count: Number(row.count),
      obtainedAt: new Date(row.first_at).toISOString(),
    })),
    total: Number(countRes.rows[0]?.total ?? 0),
  };
}

export async function getCollectionCounts(userId: string) {
  const totalRes = await query(
    `SELECT COUNT(*)::int AS total FROM gacha_item WHERE status = 1`,
  );
  const collectedRes = await query(
    `SELECT COUNT(*)::int AS collected FROM gacha_collection WHERE user_id = $1`,
    [userId],
  );
  return {
    collectionTotal: Number(totalRes.rows[0]?.total ?? 0),
    collectionCount: Number(collectedRes.rows[0]?.collected ?? 0),
  };
}
