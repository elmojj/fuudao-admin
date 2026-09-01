import type { PoolClient } from 'pg';
import { getBoxState } from '../box/box-service';
import { query, withTransaction } from '../db';
import { ensureGachaTables } from '../gacha/migrate';
import { grantDrawChances } from '../gacha/chance';
import { grantScore } from '../gacha/score';
import { formatTime, newId, paginate, toStr } from '../response';

function pageParams(body: Record<string, unknown>) {
  return paginate(body.page as number, body.pageSize as number);
}

function mapGachaItemRow(row: Record<string, unknown>) {
  return {
    itemId: toStr(row.item_id),
    name: toStr(row.name),
    rarity: toStr(row.rarity),
    rarityScore: Number(row.rarity_score || 0),
    scoreValue: Number(row.score_value || 0),
    series: toStr(row.series),
    seriesTotal: Number(row.series_total || 0),
    image: toStr(row.image),
    animation: toStr(row.animation),
    dropWeight: Number(row.drop_weight || 0),
    poolId: toStr(row.pool_id),
    isLimited: Boolean(row.is_limited),
    limitedEnd: row.limited_end ? formatTime(row.limited_end) : '',
    status: Number(row.status ?? 1),
    createdAt: formatTime(row.created_at),
  };
}

function mapGachaPoolRow(row: Record<string, unknown>, itemCount = 0) {
  return {
    poolId: toStr(row.pool_id),
    name: toStr(row.name),
    description: toStr(row.description),
    coverImage: toStr(row.cover_image),
    sort: Number(row.sort ?? 0),
    status: Number(row.status ?? 1),
    itemCount,
    createdAt: formatTime(row.created_at),
  };
}

export async function handleGachaPoolList(body: Record<string, unknown>) {
  await ensureGachaTables();
  const { limit, offset } = pageParams(body);
  const countRes = await query(`SELECT COUNT(*)::text AS count FROM gacha_pool`);
  const listRes = await query(
    `SELECT p.*,
            (SELECT COUNT(*)::int FROM gacha_item i WHERE i.pool_id = p.pool_id AND i.status = 1) AS item_count
     FROM gacha_pool p
     ORDER BY p.sort DESC, p.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  return {
    total: Number(countRes.rows[0]?.count || 0),
    lists: listRes.rows.map((row) =>
      mapGachaPoolRow(row, Number(row.item_count || 0)),
    ),
  };
}

export async function handleGachaPoolCreateOrUpdate(
  body: Record<string, unknown>,
) {
  await ensureGachaTables();
  const poolId = toStr(body.poolId || body.id || newId('pool'));
  const exists = await query(`SELECT 1 FROM gacha_pool WHERE pool_id = $1`, [
    poolId,
  ]);
  if (exists.rowCount) {
    await query(
      `UPDATE gacha_pool
       SET name = $2, description = $3, cover_image = $4, sort = $5, status = $6
       WHERE pool_id = $1`,
      [
        poolId,
        body.name,
        body.description || '',
        body.coverImage || '',
        Number(body.sort ?? 0),
        body.status === false || body.status === 0 ? 0 : 1,
      ],
    );
  } else {
    await query(
      `INSERT INTO gacha_pool (pool_id, name, description, cover_image, sort, status)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        poolId,
        body.name,
        body.description || '',
        body.coverImage || '',
        Number(body.sort ?? 0),
        body.status === false || body.status === 0 ? 0 : 1,
      ],
    );
  }
  return { poolId };
}

export async function handleGachaItemList(body: Record<string, unknown>) {
  await ensureGachaTables();
  const { limit, offset } = pageParams(body);
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (body.poolId) {
    conditions.push(`pool_id = $${idx++}`);
    values.push(body.poolId);
  }
  if (body.rarity) {
    conditions.push(`rarity = $${idx++}`);
    values.push(body.rarity);
  }
  if (body.name) {
    conditions.push(`name ILIKE $${idx++}`);
    values.push(`%${body.name}%`);
  }
  if (body.status !== undefined && body.status !== '') {
    conditions.push(`status = $${idx++}`);
    values.push(Number(body.status) === 1 ? 1 : 0);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRes = await query(
    `SELECT COUNT(*)::text AS count FROM gacha_item ${where}`,
    values,
  );
  values.push(limit, offset);
  const listRes = await query(
    `SELECT * FROM gacha_item ${where} ORDER BY drop_weight DESC, item_id ASC
     LIMIT $${idx++} OFFSET $${idx}`,
    values,
  );

  const items = listRes.rows.map(mapGachaItemRow);
  const totalWeight = items.reduce((sum, item) => sum + item.dropWeight, 0);
  return {
    total: Number(countRes.rows[0]?.count || 0),
    lists: items.map((item) => ({
      ...item,
      dropRate:
        totalWeight > 0
          ? Math.round((item.dropWeight / totalWeight) * 10000) / 100
          : 0,
    })),
  };
}

export async function handleGachaItemCreateOrUpdate(
  body: Record<string, unknown>,
) {
  await ensureGachaTables();
  const itemId = toStr(body.itemId || body.id || newId('gi'));
  const exists = await query(`SELECT 1 FROM gacha_item WHERE item_id = $1`, [
    itemId,
  ]);
  const params = [
    toStr(body.name),
    toStr(body.rarity || 'N'),
    Number(body.rarityScore ?? 1),
    Number(body.scoreValue ?? 10),
    toStr(body.series || '默认套系'),
    Number(body.seriesTotal ?? 6),
    body.image || '',
    body.animation || 'normal',
    Number(body.dropWeight ?? 1),
    toStr(body.poolId || 'default'),
    Boolean(body.isLimited),
    body.limitedEnd || null,
    body.status === false || body.status === 0 ? 0 : 1,
  ];

  if (exists.rowCount) {
    await query(
      `UPDATE gacha_item
       SET name=$2, rarity=$3, rarity_score=$4, score_value=$5, series=$6,
           series_total=$7, image=$8, animation=$9, drop_weight=$10, pool_id=$11,
           is_limited=$12, limited_end=$13, status=$14
       WHERE item_id=$1`,
      [itemId, ...params],
    );
  } else {
    await query(
      `INSERT INTO gacha_item
       (item_id, name, rarity, rarity_score, score_value, series, series_total,
        image, animation, drop_weight, pool_id, is_limited, limited_end, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [itemId, ...params],
    );
  }
  return { itemId };
}

export async function handleGachaItemDelete(body: Record<string, unknown>) {
  await ensureGachaTables();
  await query(`UPDATE gacha_item SET status = 0 WHERE item_id = $1`, [
    body.itemId || body.id,
  ]);
  return null;
}

export async function handleGachaDrawLogList(body: Record<string, unknown>) {
  await ensureGachaTables();
  const { limit, offset } = pageParams(body);
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (body.userId) {
    conditions.push(`l.user_id = $${idx++}`);
    values.push(body.userId);
  }
  if (body.poolId) {
    conditions.push(`l.pool_id = $${idx++}`);
    values.push(body.poolId);
  }
  if (body.drawType) {
    conditions.push(`l.draw_type = $${idx++}`);
    values.push(body.drawType);
  }
  if (body.rarity) {
    conditions.push(`l.rarity = $${idx++}`);
    values.push(body.rarity);
  }
  if (body.keyword) {
    conditions.push(
      `(u.nickname ILIKE $${idx} OR l.user_id ILIKE $${idx} OR i.name ILIKE $${idx})`,
    );
    values.push(`%${body.keyword}%`);
    idx += 1;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRes = await query(
    `SELECT COUNT(*)::text AS count
     FROM gacha_draw_log l
     LEFT JOIN app_user u ON u.id = l.user_id
     LEFT JOIN gacha_item i ON i.item_id = l.item_id
     ${where}`,
    values,
  );
  values.push(limit, offset);
  const listRes = await query(
    `SELECT l.*, u.nickname, COALESCE(i.name, bi.item_name, l.item_id) AS item_name
     FROM gacha_draw_log l
     LEFT JOIN app_user u ON u.id = l.user_id
     LEFT JOIN gacha_item i ON i.item_id = l.item_id
     LEFT JOIN bag_item bi ON bi.id = l.item_id
     ${where}
     ORDER BY l.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    values,
  );

  return {
    total: Number(countRes.rows[0]?.count || 0),
    lists: listRes.rows.map((row) => ({
      id: String(row.id),
      userId: toStr(row.user_id),
      nickname: toStr(row.nickname),
      poolId: toStr(row.pool_id),
      itemId: toStr(row.item_id),
      itemName: toStr(row.item_name),
      rarity: toStr(row.rarity),
      rarityScore: Number(row.rarity_score),
      scoreGained: Number(row.score_gained),
      isDuplicate: Boolean(row.is_duplicate),
      fragments: Number(row.fragments),
      drawType: toStr(row.draw_type),
      batchId: toStr(row.batch_id),
      createdAt: formatTime(row.created_at),
    })),
  };
}

export async function handleGachaChanceLogList(body: Record<string, unknown>) {
  await ensureGachaTables();
  const { limit, offset } = pageParams(body);
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (body.userId) {
    conditions.push(`c.user_id = $${idx++}`);
    values.push(body.userId);
  }
  if (body.source) {
    conditions.push(`c.source = $${idx++}`);
    values.push(body.source);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRes = await query(
    `SELECT COUNT(*)::text AS count FROM gacha_chance_log c ${where}`,
    values,
  );
  values.push(limit, offset);
  const listRes = await query(
    `SELECT c.*, u.nickname FROM gacha_chance_log c
     LEFT JOIN app_user u ON u.id = c.user_id
     ${where}
     ORDER BY c.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    values,
  );
  return {
    total: Number(countRes.rows[0]?.count || 0),
    lists: listRes.rows.map((row) => ({
      id: String(row.id),
      userId: toStr(row.user_id),
      nickname: toStr(row.nickname),
      delta: Number(row.delta),
      balance: Number(row.balance),
      source: toStr(row.source),
      createdAt: formatTime(row.created_at),
    })),
  };
}

export async function handleGachaScoreLogList(body: Record<string, unknown>) {
  await ensureGachaTables();
  const { limit, offset } = pageParams(body);
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (body.userId) {
    conditions.push(`s.user_id = $${idx++}`);
    values.push(body.userId);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRes = await query(
    `SELECT COUNT(*)::text AS count FROM gacha_score_log s ${where}`,
    values,
  );
  values.push(limit, offset);
  const listRes = await query(
    `SELECT s.*, u.nickname FROM gacha_score_log s
     LEFT JOIN app_user u ON u.id = s.user_id
     ${where}
     ORDER BY s.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    values,
  );
  return {
    total: Number(countRes.rows[0]?.count || 0),
    lists: listRes.rows.map((row) => ({
      id: String(row.id),
      userId: toStr(row.user_id),
      nickname: toStr(row.nickname),
      delta: Number(row.delta),
      balance: Number(row.balance),
      source: toStr(row.source),
      refId: toStr(row.ref_id),
      createdAt: formatTime(row.created_at),
    })),
  };
}

export async function handleGachaRankSnapshotList(body: Record<string, unknown>) {
  await ensureGachaTables();
  const { limit, offset } = pageParams(body);
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (body.rankType) {
    conditions.push(`rank_type = $${idx++}`);
    values.push(body.rankType);
  }
  if (body.periodKey) {
    conditions.push(`period_key = $${idx++}`);
    values.push(body.periodKey);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRes = await query(
    `SELECT COUNT(*)::text AS count FROM gacha_rank_snapshot ${where}`,
    values,
  );
  values.push(limit, offset);
  const listRes = await query(
    `SELECT * FROM gacha_rank_snapshot ${where}
     ORDER BY snapshot_at DESC, rank ASC
     LIMIT $${idx++} OFFSET $${idx}`,
    values,
  );
  return {
    total: Number(countRes.rows[0]?.count || 0),
    lists: listRes.rows.map((row) => ({
      id: String(row.id),
      rankType: toStr(row.rank_type),
      periodKey: toStr(row.period_key),
      rank: Number(row.rank),
      userId: toStr(row.user_id),
      nickname: toStr(row.nickname),
      score: Number(row.score),
      title: toStr(row.title),
      snapshotAt: formatTime(row.snapshot_at),
    })),
  };
}

export async function handleGachaChanceGrant(body: Record<string, unknown>) {
  await ensureGachaTables();
  const userId = toStr(body.userId);
  const delta = Number(body.delta);
  if (!userId || !delta) return { error: '参数不完整' };

  const balance = await withTransaction(async (client: PoolClient) =>
    grantDrawChances(client, userId, delta, toStr(body.source || 'admin_grant')),
  );
  return { balance };
}

export async function handleGachaScoreGrant(body: Record<string, unknown>) {
  await ensureGachaTables();
  const userId = toStr(body.userId);
  const delta = Number(body.delta);
  if (!userId || !delta) return { error: '参数不完整' };

  const balance = await withTransaction(async (client: PoolClient) =>
    grantScore(client, userId, delta, toStr(body.source || 'admin_grant')),
  );
  return { balance };
}

export async function handleUserCollectionList(body: Record<string, unknown>) {
  await ensureGachaTables();
  const userId = toStr(body.userId);
  const { limit, offset } = pageParams(body);
  const countRes = await query(
    `SELECT COUNT(*)::text AS count FROM gacha_collection WHERE user_id = $1`,
    [userId],
  );
  const listRes = await query(
    `SELECT c.*, COALESCE(i.name, bi.item_name, c.item_id) AS item_name,
            COALESCE(i.rarity, bi.rarity, 'N') AS rarity,
            COALESCE(i.image, bi.item_cover, '') AS image
     FROM gacha_collection c
     LEFT JOIN gacha_item i ON i.item_id = c.item_id
     LEFT JOIN bag_item bi ON bi.id = c.item_id
     WHERE c.user_id = $1
     ORDER BY c.first_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return {
    total: Number(countRes.rows[0]?.count || 0),
    lists: listRes.rows.map((row) => ({
      itemId: toStr(row.item_id),
      itemName: toStr(row.item_name),
      rarity: toStr(row.rarity),
      image: toStr(row.image),
      count: Number(row.count),
      firstAt: formatTime(row.first_at),
    })),
  };
}

export async function handleBagBoxStateAdmin(body: Record<string, unknown>) {
  const bagId = toStr(body.bagId);
  if (!bagId) return { error: 'bagId 不能为空' };
  const state = await getBoxState(bagId);
  if (!state) return { error: '福袋不存在' };

  const bagRes = await query(`SELECT * FROM bag WHERE id = $1`, [bagId]);
  const bag = bagRes.rows[0];
  const itemsRes = await query(
    `SELECT bi.*, il.level_name
     FROM bag_item bi
     LEFT JOIN item_level il ON il.id = bi.level_id
     WHERE bi.grab_bag_id = $1
     ORDER BY bi.sort ASC`,
    [bagId],
  );

  return {
    state,
    bag: bag
      ? {
          id: toStr(bag.id),
          packageName: toStr(bag.package_name),
          price: Number(bag.price || 0),
          totalPackage: Number(bag.total_package || 0),
          status: Boolean(bag.status),
          endTime: bag.end_time ? formatTime(bag.end_time) : '',
        }
      : null,
    items: itemsRes.rows.map((row) => ({
      id: toStr(row.id),
      itemName: toStr(row.item_name),
      itemCover: toStr(row.item_cover),
      probRate: Number(row.prob_rate || 0),
      surplusCount: Number(row.surplus_count || 0),
      totalCount: Number(row.total_count || 0),
      levelName: toStr(row.level_name),
      rarity: toStr(row.rarity),
    })),
  };
}

export async function handleDashboardStats() {
  await ensureGachaTables();
  const todayDrawsRes = await query(
    `SELECT COUNT(*)::int AS cnt FROM gacha_draw_log
     WHERE created_at::date = CURRENT_DATE`,
  );
  const totalUsersRes = await query(`SELECT COUNT(*)::int AS cnt FROM app_user`);
  const todayUsersRes = await query(
    `SELECT COUNT(*)::int AS cnt FROM app_user WHERE created_at::date = CURRENT_DATE`,
  );
  const itemCountRes = await query(
    `SELECT COUNT(*)::int AS cnt FROM gacha_item WHERE status = 1`,
  );
  const urTodayRes = await query(
    `SELECT COUNT(*)::int AS cnt FROM gacha_draw_log
     WHERE rarity = 'UR' AND created_at::date = CURRENT_DATE`,
  );
  const rankRes = await query(
    `SELECT rank_type, period_key, nickname, score, rank
     FROM gacha_rank_snapshot
     WHERE rank <= 3
     ORDER BY snapshot_at DESC, rank ASC
     LIMIT 9`,
  );

  return {
    todayDraws: Number(todayDrawsRes.rows[0]?.cnt ?? 0),
    todayUsers: Number(todayUsersRes.rows[0]?.cnt ?? 0),
    totalUsers: Number(totalUsersRes.rows[0]?.cnt ?? 0),
    activeItems: Number(itemCountRes.rows[0]?.cnt ?? 0),
    todayUr: Number(urTodayRes.rows[0]?.cnt ?? 0),
    rankPreview: rankRes.rows.map((row) => ({
      rankType: toStr(row.rank_type),
      periodKey: toStr(row.period_key),
      nickname: toStr(row.nickname),
      score: Number(row.score),
      rank: Number(row.rank),
    })),
  };
}
