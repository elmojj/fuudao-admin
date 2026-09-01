import type { PoolClient } from 'pg';
import { query, withTransaction } from '../db';
import { newId } from '../response';
import { grantDrawChances } from './chance';
import { grantScore } from './score';
import {
  FRAGMENTS_BY_RARITY,
  GACHA_SR_PITY,
  GACHA_SSR_PITY,
  RARITY_RANK,
  type GachaItemRow,
  type Rarity,
} from './types';
import { getWeekKey, mapGachaItem } from './utils';
import { unlockTitle } from './profile';

type DrawError = { code: number; message: string };

function pickWeightedItem(
  items: GachaItemRow[],
  minRank: number,
): GachaItemRow {
  const eligible = items.filter(
    (item) => RARITY_RANK[item.rarity as Rarity] >= minRank,
  );
  if (!eligible.length) {
    throw new Error('No eligible items in pool');
  }
  const totalWeight = eligible.reduce(
    (sum, item) => sum + Number(item.drop_weight),
    0,
  );
  let roll = Math.random() * totalWeight;
  for (const item of eligible) {
    roll -= Number(item.drop_weight);
    if (roll <= 0) return item;
  }
  return eligible[eligible.length - 1];
}

async function loadPoolItems(poolId: string): Promise<GachaItemRow[]> {
  const res = await query(
    `SELECT * FROM gacha_item
     WHERE pool_id = $1 AND status = 1
       AND (is_limited = FALSE OR limited_end IS NULL OR limited_end > NOW())
     ORDER BY drop_weight DESC`,
    [poolId],
  );
  return res.rows as GachaItemRow[];
}

async function ensureWeekReset(client: PoolClient, userId: string) {
  const weekKey = getWeekKey();
  await client.query(
    `UPDATE app_user
     SET week_draws = 0,
         week_task_points = 0,
         week_max_lucky = 0,
         week_lucky_at = NULL,
         week_key = $2,
         updated_at = NOW()
     WHERE id = $1 AND week_key IS DISTINCT FROM $2`,
    [userId, weekKey],
  );
}

async function applyCollection(
  client: PoolClient,
  userId: string,
  item: GachaItemRow,
): Promise<{ isNew: boolean; isDuplicate: boolean; fragments: number }> {
  const existing = await client.query(
    `SELECT count FROM gacha_collection WHERE user_id = $1 AND item_id = $2`,
    [userId, item.item_id],
  );

  if (!existing.rowCount) {
    await client.query(
      `INSERT INTO gacha_collection (user_id, item_id, count, first_at, updated_at)
       VALUES ($1, $2, 1, NOW(), NOW())`,
      [userId, item.item_id],
    );
    return { isNew: true, isDuplicate: false, fragments: 0 };
  }

  const fragments = FRAGMENTS_BY_RARITY[item.rarity as Rarity] || 1;
  await client.query(
    `UPDATE gacha_collection
     SET count = count + 1, updated_at = NOW()
     WHERE user_id = $1 AND item_id = $2`,
    [userId, item.item_id],
  );
  await client.query(
    `UPDATE app_user SET fragments = fragments + $2, updated_at = NOW() WHERE id = $1`,
    [userId, fragments],
  );
  return { isNew: false, isDuplicate: true, fragments };
}

async function checkSeriesComplete(
  client: PoolClient,
  userId: string,
  series: string,
): Promise<boolean> {
  const done = await client.query(
    `SELECT 1 FROM gacha_collection_series WHERE user_id = $1 AND series = $2`,
    [userId, series],
  );
  if (done.rowCount) return false;

  const totalRes = await client.query(
    `SELECT COUNT(DISTINCT item_id)::int AS total
     FROM gacha_item WHERE series = $1 AND status = 1`,
    [series],
  );
  const total = Number(totalRes.rows[0]?.total ?? 0);
  if (!total) return false;

  const collectedRes = await client.query(
    `SELECT COUNT(DISTINCT c.item_id)::int AS collected
     FROM gacha_collection c
     JOIN gacha_item i ON i.item_id = c.item_id
     WHERE c.user_id = $1 AND i.series = $2`,
    [userId, series],
  );
  const collected = Number(collectedRes.rows[0]?.collected ?? 0);
  if (collected < total) return false;

  await client.query(
    `INSERT INTO gacha_collection_series (user_id, series, completed_at)
     VALUES ($1, $2, NOW())`,
    [userId, series],
  );
  await grantScore(client, userId, 300, 'series_complete', series);
  await grantDrawChances(client, userId, 3, 'series_complete');
  return true;
}

export async function listGachaPools() {
  const res = await query(
    `SELECT pool_id, name, status, sort
     FROM gacha_pool
     WHERE status = 1
     ORDER BY sort DESC, created_at DESC`,
  );
  return {
    pools: res.rows.map((row) => ({
      poolId: row.pool_id as string,
      name: row.name as string,
      enabled: Number(row.status) === 1,
      sortOrder: Number(row.sort ?? 0),
    })),
  };
}

export async function getGachaPool(poolId: string) {
  const poolRes = await query(
    `SELECT * FROM gacha_pool WHERE pool_id = $1 AND status = 1`,
    [poolId],
  );
  if (!poolRes.rowCount) return null;

  const items = await loadPoolItems(poolId);
  const totalWeight = items.reduce(
    (sum, item) => sum + Number(item.drop_weight),
    0,
  );

  const rarityTotals: Record<string, number> = {};
  for (const item of items) {
    rarityTotals[item.rarity] =
      (rarityTotals[item.rarity] || 0) + Number(item.drop_weight);
  }

  const rates = Object.entries(rarityTotals).map(([rarity, weight]) => ({
    rarity: rarity as Rarity,
    rate: Math.round((weight / totalWeight) * 10000) / 100,
  }));

  const pool = poolRes.rows[0];
  return {
    poolId: pool.pool_id,
    name: pool.name,
    description: pool.description || '',
    coverImage: pool.cover_image || '',
    items: items.map((item) =>
      mapGachaItem(
        item,
        Math.round((Number(item.drop_weight) / totalWeight) * 10000) / 100,
      ),
    ),
    rates,
  };
}

export async function getPityState(userId: string) {
  const res = await query(
    `SELECT pity_sr_count, pity_ssr_count FROM app_user WHERE id = $1`,
    [userId],
  );
  const row = res.rows[0];
  return {
    drawsSinceSR: Number(row?.pity_sr_count ?? 0),
    drawsSinceSSR: Number(row?.pity_ssr_count ?? 0),
    srPityAt: GACHA_SR_PITY,
    ssrPityAt: GACHA_SSR_PITY,
  };
}

export async function executeDraw(
  userId: string,
  poolId: string,
  count: 1 | 10,
): Promise<DrawError | Record<string, unknown>> {
  const poolRes = await query(
    `SELECT * FROM gacha_pool WHERE pool_id = $1 AND status = 1`,
    [poolId],
  );
  if (!poolRes.rowCount) {
    return { code: 40002, message: '赏池不存在或已关闭' };
  }

  const items = await loadPoolItems(poolId);
  if (!items.length) {
    return { code: 40002, message: '赏池不存在或已关闭' };
  }

  const batchId = newId('draw');

  return withTransaction(async (client) => {
    await ensureWeekReset(client, userId);

    const userRes = await client.query(
      `SELECT draw_chances, pity_sr_count, pity_ssr_count, total_score,
              week_max_lucky, week_lucky_at
       FROM app_user WHERE id = $1 FOR UPDATE`,
      [userId],
    );
    if (!userRes.rowCount) {
      return { code: 401, message: '未授权' };
    }

    const user = userRes.rows[0];
    const chances = Number(user.draw_chances);
    if (chances < count) {
      return { code: 40001, message: '抽赏次数不足' };
    }

    await grantDrawChances(client, userId, -count, 'draw');

    let pitySr = Number(user.pity_sr_count);
    let pitySsr = Number(user.pity_ssr_count);
    let weekMaxLucky = Number(user.week_max_lucky);
    let weekLuckyAt: Date | null = user.week_lucky_at
      ? new Date(user.week_lucky_at)
      : null;
    let totalScore = Number(user.total_score);

    const draws: Record<string, unknown>[] = [];

    for (let i = 0; i < count; i++) {
      pitySr += 1;
      pitySsr += 1;

      let minRank = 1;
      if (pitySsr >= GACHA_SSR_PITY) minRank = 4;
      else if (pitySr >= GACHA_SR_PITY) minRank = 3;

      const item = pickWeightedItem(items, minRank);
      const itemRank = RARITY_RANK[item.rarity as Rarity];

      if (itemRank >= 3) pitySr = 0;
      if (itemRank >= 4) pitySsr = 0;

      const collection = await applyCollection(client, userId, item);
      totalScore = await grantScore(
        client,
        userId,
        item.score_value,
        'draw',
        item.item_id,
      );

      if (item.rarity_score > weekMaxLucky) {
        weekMaxLucky = item.rarity_score;
        weekLuckyAt = new Date();
      } else if (
        item.rarity_score === weekMaxLucky &&
        (!weekLuckyAt || new Date() < weekLuckyAt)
      ) {
        weekLuckyAt = new Date();
      }

      await client.query(
        `INSERT INTO gacha_draw_log
         (user_id, pool_id, item_id, rarity, rarity_score, score_gained,
          is_duplicate, fragments, draw_type, batch_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'single',$9)`,
        [
          userId,
          poolId,
          item.item_id,
          item.rarity,
          item.rarity_score,
          item.score_value,
          collection.isDuplicate,
          collection.fragments,
          batchId,
        ],
      );

      draws.push({
        item: mapGachaItem(item),
        isNew: collection.isNew,
        isDuplicate: collection.isDuplicate,
        fragmentsGained: collection.fragments,
        scoreGained: item.score_value,
        luckyGained: item.rarity_score,
      });

      await checkSeriesComplete(client, userId, item.series);
    }

    await client.query(
      `UPDATE app_user
       SET pity_sr_count = $2,
           pity_ssr_count = $3,
           total_draws = total_draws + $4,
           week_draws = week_draws + $4,
           week_max_lucky = $5,
           week_lucky_at = $6,
           updated_at = NOW()
       WHERE id = $1`,
      [userId, pitySr, pitySsr, count, weekMaxLucky, weekLuckyAt],
    );

    const drawCountRes = await client.query(
      `SELECT total_draws FROM app_user WHERE id = $1`,
      [userId],
    );
    const totalDraws = Number(drawCountRes.rows[0]?.total_draws ?? 0);
    if (totalDraws >= 10) {
      await unlockTitle(client, userId, 'draw_10');
    }

    const balanceRes = await client.query(
      `SELECT draw_chances FROM app_user WHERE id = $1`,
      [userId],
    );

    return {
      batchId,
      draws,
      pity: {
        drawsSinceSR: pitySr,
        drawsSinceSSR: pitySsr,
        srPityAt: GACHA_SR_PITY,
        ssrPityAt: GACHA_SSR_PITY,
      },
      balance: Number(balanceRes.rows[0]?.draw_chances ?? 0),
      totalScore,
    };
  });
}

export async function getDrawLogs(
  userId: string,
  limit: number,
  offset: number,
) {
  const countRes = await query(
    `SELECT COUNT(*)::int AS total FROM gacha_draw_log WHERE user_id = $1`,
    [userId],
  );
  const res = await query(
    `SELECT l.id, l.is_duplicate, l.created_at,
            i.item_id, i.name, i.rarity, i.rarity_score, i.score_value,
            i.series, i.series_total, i.image, i.animation
     FROM gacha_draw_log l
     JOIN gacha_item i ON i.item_id = l.item_id
     WHERE l.user_id = $1
     ORDER BY l.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );

  return {
    items: res.rows.map((row) => ({
      id: String(row.id),
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
      isDuplicate: Boolean(row.is_duplicate),
      createdAt: new Date(row.created_at).toISOString(),
    })),
    total: Number(countRes.rows[0]?.total ?? 0),
  };
}
