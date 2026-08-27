import { query } from '../db';
import { formatTime, newId, paginate, toNumStr, toStr, appendStatusCondition } from '../response';

export async function handleLogisticsList(body: Record<string, unknown>) {
  const { limit, offset } = paginate(body.page as number, body.pageSize as number);
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (body.userId) {
    conditions.push(`l.user_id = $${idx++}`);
    values.push(body.userId);
  }
  if (body.deliveryId) {
    conditions.push(`l.delivery_id = $${idx++}`);
    values.push(body.deliveryId);
  }
  if (body.trackingNumber) {
    conditions.push(`l.tracking_number ILIKE $${idx++}`);
    values.push(`%${body.trackingNumber}%`);
  }
  idx = appendStatusCondition('l.status', body.status, conditions, values, idx);
  if (body.startTime) {
    conditions.push(`l.created_at >= $${idx++}`);
    values.push(body.startTime);
  }
  if (body.endTime) {
    conditions.push(`l.created_at <= $${idx++}`);
    values.push(body.endTime);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM logistics l ${where}`,
    values,
  );
  values.push(limit, offset);
  const listRes = await query(
    `SELECT l.*, d.delivery_name, u.nickname, u.avatar
     FROM logistics l
     LEFT JOIN delivery d ON d.delivery_id = l.delivery_id
     LEFT JOIN app_user u ON u.id = l.user_id
     ${where}
     ORDER BY l.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    values,
  );
  const lists = await Promise.all(listRes.rows.map(mapLogistics));
  return { total: Number(countRes.rows[0]?.count || 0), lists };
}

export async function handleLogisticsUpdate(body: Record<string, unknown>) {
  const ids = Array.isArray(body.id) ? body.id : [body.id];
  for (const id of ids) {
    await query(
      `UPDATE logistics SET status=$2, tracking_number=$3, delivery_id=$4, updated_at=NOW() WHERE id=$1`,
      [id, Number(body.status), body.trackingNumber || '', body.deliveryId || null],
    );
  }
  return null;
}

export async function handleLogisticsBatchDelivery(
  body: Record<string, unknown>,
) {
  const ids = Array.isArray(body.ids) ? body.ids : [body.ids];
  for (const id of ids) {
    await query(
      `UPDATE logistics SET status=3, tracking_number=$2, delivery_id=$3, updated_at=NOW() WHERE id=$1`,
      [id, body.trackingNumber || '', body.deliveryId || null],
    );
  }
  return null;
}

export async function handleLogisticsBatchSign(body: Record<string, unknown>) {
  const ids = (body.ids as string[]) || [];
  for (const id of ids) {
    await query(
      `UPDATE logistics SET status=4, updated_at=NOW() WHERE id=$1`,
      [id],
    );
  }
  return null;
}

export async function handleLogisticsDelivery() {
  const res = await query('SELECT * FROM delivery ORDER BY delivery_name ASC');
  return {
    lists: res.rows.map((row) => ({
      deliveryId: toStr(row.delivery_id),
      deliveryName: toStr(row.delivery_name),
    })),
  };
}

export async function handleLogisticsExport() {
  const res = await query(
    `SELECT l.*, d.delivery_name, u.nickname FROM logistics l
     LEFT JOIN delivery d ON d.delivery_id = l.delivery_id
     LEFT JOIN app_user u ON u.id = l.user_id
     ORDER BY l.created_at DESC LIMIT 1000`,
  );
  const header =
    'id,userId,consignee,phoneNumber,address,status,trackingNumber,deliveryName\n';
  const rows = res.rows
    .map((row) =>
      [
        row.id,
        row.user_id,
        row.consignee,
        row.phone_number,
        `${row.province}${row.city}${row.area}${row.address}`,
        row.status,
        row.tracking_number,
        row.delivery_name,
      ].join(','),
    )
    .join('\n');
  const csv = `\uFEFF${header}${rows}`;
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv;charset=utf-8',
      'Content-Disposition': `attachment; filename=logistics_${Date.now()}.csv`,
    },
  });
}

async function mapLogistics(row: Record<string, unknown>) {
  const logisticsId = toStr(row.id);
  const indexRes = await query(
    `SELECT gbi.*, bi.item_name, bi.item_cover, il.level_name, b.package_name
     FROM grab_bag_index gbi
     LEFT JOIN bag_item bi ON bi.id = gbi.grab_bag_item_id
     LEFT JOIN item_level il ON il.id = bi.level_id
     LEFT JOIN bag b ON b.id = gbi.grab_bag_id
     WHERE gbi.logistics_id = $1`,
    [logisticsId],
  );
  return {
    id: logisticsId,
    indexIds: toStr(row.index_ids),
    orderIds: toStr(row.order_ids),
    userId: toStr(row.user_id),
    trackingNumber: toStr(row.tracking_number),
    trackingToken: toStr(row.tracking_token),
    deliveryId: toStr(row.delivery_id),
    deliveryName: toStr(row.delivery_name),
    consignee: toStr(row.consignee),
    phoneNumber: toStr(row.phone_number),
    province: toStr(row.province),
    city: toStr(row.city),
    area: toStr(row.area),
    address: toStr(row.address),
    zipcode: toStr(row.zipcode),
    price: toNumStr(row.price),
    transactionId: toStr(row.transaction_id),
    status: Number(row.status),
    createdAt: formatTime(row.created_at),
    updatedAt: formatTime(row.updated_at),
    userInfo: {
      nickname: toStr(row.nickname),
      avatar: toStr(row.avatar),
    },
    indexInfo: indexRes.rows.map((idx) => ({
      id: toStr(idx.id),
      grabBagId: toStr(idx.grab_bag_id),
      grabBagItemId: toStr(idx.grab_bag_item_id),
      userId: toStr(idx.user_id),
      itemName: toStr(idx.item_name),
      itemCover: toStr(idx.item_cover),
      levelId: toStr(idx.level_id),
      levelName: toStr(idx.level_name),
      index: Number(idx.index_no),
      grabBagName: toStr(idx.package_name),
      status: Number(idx.status),
    })),
  };
}
