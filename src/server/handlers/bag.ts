import { query } from '../db';
import { formatTime, newId, paginate, toNumStr, toStr } from '../response';

export async function handleBagCategoryList(body: Record<string, unknown>) {
  const { limit, offset } = paginate(body.page as number, body.pageSize as number);
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (body.categoryName) {
    conditions.push(`category_name ILIKE $${idx++}`);
    values.push(`%${body.categoryName}%`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM bag_category ${where}`,
    values,
  );
  values.push(limit, offset);
  const listRes = await query(
    `SELECT * FROM bag_category ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
    values,
  );
  return {
    total: Number(countRes.rows[0]?.count || 0),
    lists: listRes.rows.map((row) => ({
      id: toStr(row.id),
      categoryName: toStr(row.category_name),
      createdAt: formatTime(row.created_at),
      updatedAt: formatTime(row.updated_at),
    })),
  };
}

export async function handleBagCategoryCreateOrUpdate(
  body: Record<string, unknown>,
) {
  const id = (body.id as string) || newId('cat');
  const exists = await query('SELECT id FROM bag_category WHERE id = $1', [id]);
  if (exists.rowCount) {
    await query(
      `UPDATE bag_category SET category_name=$2, updated_at=NOW() WHERE id=$1`,
      [id, body.categoryName],
    );
  } else {
    await query(
      `INSERT INTO bag_category (id, category_name) VALUES ($1, $2)`,
      [id, body.categoryName],
    );
  }
  return null;
}

export async function handleBagList(body: Record<string, unknown>) {
  const { limit, offset } = paginate(body.page as number, body.pageSize as number);
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (body.packageName) {
    conditions.push(`b.package_name ILIKE $${idx++}`);
    values.push(`%${body.packageName}%`);
  }
  if (body.categoryId) {
    conditions.push(`b.category_id = $${idx++}`);
    values.push(body.categoryId);
  }
  if (body.bagId) {
    conditions.push(`b.id = $${idx++}`);
    values.push(body.bagId);
  }
  if (body.status !== undefined && body.status !== '') {
    conditions.push(`b.status = $${idx++}`);
    values.push(body.status === true || body.status === 'true');
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM bag b ${where}`,
    values,
  );
  values.push(limit, offset);
  const listRes = await query(
    `SELECT b.*, c.category_name,
      ep.id AS ep_id, ep.item_name AS ep_name, ep.item_cover AS ep_cover,
      lp.id AS lp_id, lp.item_name AS lp_name, lp.item_cover AS lp_cover
     FROM bag b
     LEFT JOIN bag_category c ON c.id = b.category_id
     LEFT JOIN bag_item ep ON ep.id = b.every_prize_item_id
     LEFT JOIN bag_item lp ON lp.id = b.last_prize_item_id
     ${where}
     ORDER BY b.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    values,
  );
  return {
    total: Number(countRes.rows[0]?.count || 0),
    lists: listRes.rows.map(mapBag),
  };
}

export async function handleBagCreateOrUpdate(body: Record<string, unknown>) {
  const id = (body.id as string) || newId('bag');
  const exists = await query('SELECT id FROM bag WHERE id = $1', [id]);
  const fields = [
    body.categoryId,
    body.packageName,
    body.cover || '',
    body.sharePhoto || '',
    Number(body.price || 0),
    body.startTime || null,
    body.endTime || null,
    Number(body.totalPackage || 0),
    Boolean(body.hasEveryPrize),
    body.everyPrizeItemId || null,
    Number(body.everyPrizeCount || 0),
    Boolean(body.hasLastPrize),
    body.lastPrizeItemId || null,
    Number(body.limitBuy || 0),
    Boolean(body.status),
  ];
  if (exists.rowCount) {
    await query(
      `UPDATE bag SET category_id=$2, package_name=$3, cover=$4, share_photo=$5, price=$6,
       start_time=$7, end_time=$8, total_package=$9, has_every_prize=$10, every_prize_item_id=$11,
       every_prize_count=$12, has_last_prize=$13, last_prize_item_id=$14, limit_buy=$15, status=$16,
       updated_at=NOW() WHERE id=$1`,
      [id, ...fields],
    );
  } else {
    await query(
      `INSERT INTO bag (id, category_id, package_name, cover, share_photo, price, start_time, end_time,
       total_package, has_every_prize, every_prize_item_id, every_prize_count, has_last_prize,
       last_prize_item_id, limit_buy, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [id, ...fields],
    );
  }
  return null;
}

function mapBag(row: Record<string, unknown>) {
  return {
    id: toStr(row.id),
    categoryId: toStr(row.category_id),
    categoryName: toStr(row.category_name),
    packageName: toStr(row.package_name),
    cover: toStr(row.cover),
    sharePhoto: toStr(row.share_photo),
    price: toNumStr(row.price),
    startTime: formatTime(row.start_time),
    endTime: formatTime(row.end_time),
    totalPackage: toNumStr(row.total_package),
    everyPrizeItemId: toStr(row.every_prize_item_id),
    hasEveryPrize: Boolean(row.has_every_prize),
    everyPrizeCount: toNumStr(row.every_prize_count),
    hasLastPrize: Boolean(row.has_last_prize),
    lastPrizeItemId: toStr(row.last_prize_item_id),
    limitBuy: toNumStr(row.limit_buy),
    status: Boolean(row.status),
    createdAt: formatTime(row.created_at),
    updatedAt: formatTime(row.updated_at),
    everyPrizeItem: row.ep_id
      ? {
          id: toStr(row.ep_id),
          itemName: toStr(row.ep_name),
          itemCover: toStr(row.ep_cover),
        }
      : { id: '', itemName: '', itemCover: '' },
    lastPrizeItem: row.lp_id
      ? {
          id: toStr(row.lp_id),
          itemName: toStr(row.lp_name),
          itemCover: toStr(row.lp_cover),
        }
      : { id: '', itemName: '', itemCover: '' },
  };
}

export async function handleItemList(body: Record<string, unknown>) {
  const grabBagId = body.grabBagId || body.id;
  const conditions = ['bi.grab_bag_id = $1'];
  const values: unknown[] = [grabBagId];
  let idx = 2;
  if (body.levelId) {
    conditions.push(`bi.level_id = $${idx++}`);
    values.push(body.levelId);
  }
  if (body.itemName) {
    conditions.push(`bi.item_name ILIKE $${idx++}`);
    values.push(`%${body.itemName}%`);
  }
  if (body.status) {
    conditions.push(`bi.status = $${idx++}`);
    values.push(Number(body.status));
  }
  const res = await query(
    `SELECT bi.*, il.level_name, b.package_name, b.cover
     FROM bag_item bi
     LEFT JOIN item_level il ON il.id = bi.level_id
     LEFT JOIN bag b ON b.id = bi.grab_bag_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY bi.sort ASC, bi.created_at ASC`,
    values,
  );
  return {
    total: res.rowCount,
    data: res.rows.map(mapBagItem),
  };
}

export async function handleItemCreateOrUpdate(body: Record<string, unknown>) {
  await upsertBagItem(body);
  return null;
}

export async function handleItemBatchCreateOrUpdate(
  body: Record<string, unknown>,
) {
  const data = (body.data as Record<string, unknown>[]) || [];
  for (const item of data) {
    await upsertBagItem(item);
  }
  return null;
}

export async function handleItemDelete(body: Record<string, unknown>) {
  await query('DELETE FROM bag_item WHERE id = $1', [body.id]);
  return null;
}

async function resolveLevelId(levelId: unknown): Promise<string> {
  const raw =
    levelId === null || levelId === undefined || levelId === ''
      ? ''
      : String(levelId);
  if (
    raw &&
    raw !== 'undefined' &&
    raw !== 'null' &&
    raw !== 'NaN' &&
    raw !== '0'
  ) {
    const exists = await query('SELECT id FROM item_level WHERE id = $1', [raw]);
    if (exists.rowCount) return raw;
  }
  const fallback = await query(
    `SELECT id FROM item_level WHERE status = 1 ORDER BY sort ASC, level_name ASC LIMIT 1`,
  );
  return toStr(fallback.rows[0]?.id) || 'level_normal';
}

async function resolveStockId(
  body: Record<string, unknown>,
): Promise<string | null> {
  const stockId = body.stockId;
  const raw =
    stockId === null || stockId === undefined || stockId === ''
      ? ''
      : String(stockId);
  if (raw && raw !== 'undefined' && raw !== 'null' && raw !== 'NaN' && raw !== '0') {
    const byId = await query('SELECT id FROM stockpile WHERE id = $1', [raw]);
    if (byId.rowCount) return raw;
    const byCode = await query('SELECT id FROM stockpile WHERE product_code = $1', [
      raw,
    ]);
    if (byCode.rowCount) return toStr(byCode.rows[0].id);
  }
  if (body.itemName) {
    const byName = await query(
      'SELECT id FROM stockpile WHERE product_name = $1 LIMIT 1',
      [body.itemName],
    );
    if (byName.rowCount) return toStr(byName.rows[0].id);
  }
  return null;
}

async function upsertBagItem(body: Record<string, unknown>) {
  const id = (body.id as string) || newId('item');
  const exists = await query('SELECT id FROM bag_item WHERE id = $1', [id]);
  const total = Number(body.totalCount || 0);
  const send = Number(body.sendCount || 0);
  const surplus = Number(body.surplusCount ?? total - send);
  const levelId = await resolveLevelId(body.levelId);
  const stockId = await resolveStockId(body);
  const values = [
    body.grabBagId,
    body.itemName,
    levelId,
    body.itemCover || '',
    stockId,
    total,
    send,
    surplus,
    Number(body.referPrice || 0),
    Number(body.stockPrice || body.referPrice || 0),
    Number(body.probRate || 0),
    Number(body.sort || 0),
    body.extJson ? JSON.stringify(body.extJson) : null,
    Number(body.status ?? 1),
  ];
  if (exists.rowCount) {
    await query(
      `UPDATE bag_item SET grab_bag_id=$2, item_name=$3, level_id=$4, item_cover=$5, stock_id=$6,
       total_count=$7, send_count=$8, surplus_count=$9, refer_price=$10, stock_price=$11,
       prob_rate=$12, sort=$13, ext_json=$14, status=$15, updated_at=NOW() WHERE id=$1`,
      [id, ...values],
    );
  } else {
    await query(
      `INSERT INTO bag_item (id, grab_bag_id, item_name, level_id, item_cover, stock_id, total_count,
       send_count, surplus_count, refer_price, stock_price, prob_rate, sort, ext_json, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [id, ...values],
    );
  }
}

function mapBagItem(row: Record<string, unknown>) {
  return {
    id: toStr(row.id),
    grabBagId: toStr(row.grab_bag_id),
    itemName: toStr(row.item_name),
    levelId: toStr(row.level_id),
    levelName: toStr(row.level_name),
    itemCover: toStr(row.item_cover),
    stockId: toStr(row.stock_id),
    totalCount: toNumStr(row.total_count),
    sendCount: toNumStr(row.send_count),
    surplusCount: toNumStr(row.surplus_count),
    referPrice: toNumStr(row.refer_price),
    stockPrice: toNumStr(row.stock_price),
    probRate: toNumStr(row.prob_rate),
    sort: toNumStr(row.sort),
    extJson: row.ext_json ? JSON.stringify(row.ext_json) : '',
    status: Number(row.status),
    bagInfo: {
      packageName: toStr(row.package_name),
      cover: toStr(row.cover),
    },
  };
}
