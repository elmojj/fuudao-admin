import { query } from '../db';
import { formatTime, newId, paginate, toNumStr, toStr } from '../response';

export async function handleStockpileList(searchParams: Record<string, string>) {
  const { limit, offset } = paginate(searchParams.page, searchParams.pageSize);
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (searchParams.productName) {
    conditions.push(`product_name ILIKE $${idx++}`);
    values.push(`%${searchParams.productName}%`);
  }
  if (searchParams.productCode) {
    conditions.push(`product_code ILIKE $${idx++}`);
    values.push(`%${searchParams.productCode}%`);
  }
  if (searchParams.id) {
    conditions.push(`id = $${idx++}`);
    values.push(searchParams.id);
  }
  if (searchParams.status) {
    conditions.push(`status = $${idx++}`);
    values.push(Number(searchParams.status));
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM stockpile ${where}`,
    values,
  );
  values.push(limit, offset);
  const listRes = await query(
    `SELECT * FROM stockpile ${where} ORDER BY create_time DESC LIMIT $${idx++} OFFSET $${idx}`,
    values,
  );

  return {
    total: Number(countRes.rows[0]?.count || 0),
    lists: listRes.rows.map(mapStockpile),
  };
}

export async function handleStockpileCreateOrUpdate(
  body: Record<string, unknown>,
) {
  const id = (body.id as string) || newId('stock');
  const status = Number(body.status ?? 1);
  const exists = await query('SELECT id FROM stockpile WHERE id = $1', [id]);
  if (exists.rowCount) {
    await query(
      `UPDATE stockpile SET product_name=$2, product_code=$3, product_photo=$4, price=$5,
       stockpile_count=$6, status=$7, update_time=NOW() WHERE id=$1`,
      [
        id,
        body.productName,
        body.productCode || '',
        body.productPhoto || '',
        Number(body.price || 0),
        Number(body.stockpileCount || 0),
        status,
      ],
    );
  } else {
    await query(
      `INSERT INTO stockpile (id, product_name, product_code, product_photo, price, stockpile_count, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        id,
        body.productName,
        body.productCode || '',
        body.productPhoto || '',
        Number(body.price || 0),
        Number(body.stockpileCount || 0),
        status,
      ],
    );
  }
  return null;
}

function mapStockpile(row: Record<string, unknown>) {
  return {
    id: toStr(row.id),
    productName: toStr(row.product_name),
    productCode: toStr(row.product_code),
    productPhoto: toStr(row.product_photo),
    price: toNumStr(row.price),
    stockpileCount: toNumStr(row.stockpile_count),
    stockpileSaleTotal: toNumStr(row.stockpile_sale_total),
    status: Number(row.status),
    createTime: formatTime(row.create_time),
    updateTime: formatTime(row.update_time),
  };
}

export async function handleItemLevelList(body: Record<string, unknown>) {
  const res = await query('SELECT * FROM item_level ORDER BY sort ASC, level_name ASC');
  return {
    total: res.rowCount,
    itemLevels: res.rows.map((row) => ({
      id: toStr(row.id),
      levelName: toStr(row.level_name),
      levelType: Number(row.level_type),
      status: Number(row.status),
      sort: Number(row.sort),
    })),
  };
}

export async function handleItemLevelCreateOrUpdate(
  body: Record<string, unknown>,
) {
  const id = (body.id as string) || newId('level');
  const exists = await query('SELECT id FROM item_level WHERE id = $1', [id]);
  if (exists.rowCount) {
    await query(
      `UPDATE item_level SET level_name=$2, level_type=$3, status=$4, sort=$5 WHERE id=$1`,
      [
        id,
        body.levelName,
        Number(body.levelType || 1),
        Number(body.status ?? 1),
        Number(body.sort || 0),
      ],
    );
  } else {
    await query(
      `INSERT INTO item_level (id, level_name, level_type, status, sort) VALUES ($1,$2,$3,$4,$5)`,
      [
        id,
        body.levelName,
        Number(body.levelType || 1),
        Number(body.status ?? 1),
        Number(body.sort || 0),
      ],
    );
  }
  return null;
}

export async function handleItemLevelDelete(body: Record<string, unknown>) {
  await query('DELETE FROM item_level WHERE id = $1', [body.id]);
  return null;
}
