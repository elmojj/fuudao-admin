import { query } from '../db';
import { formatTime, newId, paginate, toNumStr, toStr, appendStatusCondition } from '../response';

export async function handleUserList(body: Record<string, unknown>) {
  const { limit, offset } = paginate(body.page as number, body.pageSize as number);
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (body.keyword) {
    conditions.push(
      `(nickname ILIKE $${idx} OR phone_number ILIKE $${idx})`,
    );
    values.push(`%${body.keyword}%`);
    idx += 1;
  }
  if (body.phoneNumber) {
    conditions.push(`phone_number ILIKE $${idx++}`);
    values.push(`%${body.phoneNumber}%`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM app_user ${where}`,
    values,
  );
  values.push(limit, offset);
  const listRes = await query(
    `SELECT * FROM app_user ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
    values,
  );
  const users = await Promise.all(listRes.rows.map((row) => mapUser(row)));
  return { total: Number(countRes.rows[0]?.count || 0), users };
}

export async function handleUserGet(body: Record<string, unknown>) {
  const res = await query('SELECT * FROM app_user WHERE id = $1', [body.id]);
  if (!res.rowCount) return { user: null };
  return { user: await mapUser(res.rows[0]) };
}

async function mapUser(row: Record<string, unknown>) {
  const userId = toStr(row.id);
  const addressRes = await query(
    `SELECT * FROM user_address WHERE user_id = $1 ORDER BY is_default DESC LIMIT 1`,
    [userId],
  );
  const tagsRes = await query(`SELECT * FROM user_tag WHERE user_id = $1`, [
    userId,
  ]);
  const addressRow = addressRes.rows[0];
  return {
    id: userId,
    phoneNumber: toStr(row.phone_number),
    nickname: toStr(row.nickname),
    avatar: toStr(row.avatar),
    appid: toStr(row.appid),
    openid: toStr(row.openid),
    unionid: toStr(row.unionid),
    sessionKey: toStr(row.session_key),
    accessToken: toStr(row.access_token),
    userGroupName: toStr(row.user_group_name),
    createdAt: formatTime(row.created_at),
    updatedAt: formatTime(row.updated_at),
    stats: {
      buyAmountTotal: Number(row.buy_amount_total || 0),
      buyTotal: Number(row.buy_total || 0),
      rewardTotal: Number(row.reward_total || 0),
    },
    address: addressRow
      ? {
          id: toStr(addressRow.id),
          userId,
          consignee: toStr(addressRow.consignee),
          phoneNumber: toStr(addressRow.phone_number),
          province: toStr(addressRow.province),
          city: toStr(addressRow.city),
          area: toStr(addressRow.area),
          address: toStr(addressRow.address),
          zipcode: toStr(addressRow.zipcode),
          isDefault: Number(addressRow.is_default),
          status: Number(addressRow.status),
          createdAt: formatTime(addressRow.created_at),
          updatedAt: formatTime(addressRow.updated_at),
        }
      : {
          id: '',
          userId,
          consignee: '',
          phoneNumber: '',
          province: '',
          city: '',
          area: '',
          address: '',
          zipcode: '',
          isDefault: 0,
          status: 0,
          createdAt: '',
          updatedAt: '',
        },
    tags: tagsRes.rows.map((tag) => ({
      cate: toStr(tag.cate),
      cateVal: toStr(tag.cate_val),
      tagName: toStr(tag.tag_name),
    })),
  };
}

export async function handleOrderList(body: Record<string, unknown>) {
  const { limit, offset } = paginate(body.page as number, body.pageSize as number);
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (body.buyUserId) {
    conditions.push(`o.buy_user_id = $${idx++}`);
    values.push(body.buyUserId);
  }
  if (body.grabBagId) {
    conditions.push(`o.grab_bag_id = $${idx++}`);
    values.push(body.grabBagId);
  }
  idx = appendStatusCondition('o.status', body.status, conditions, values, idx);
  if (body.buyTimeStart) {
    conditions.push(`o.created_at >= $${idx++}`);
    values.push(body.buyTimeStart);
  }
  if (body.buyTimeEnd) {
    conditions.push(`o.created_at <= $${idx++}`);
    values.push(body.buyTimeEnd);
  }
  if (Array.isArray(body.orderId) && body.orderId.length) {
    conditions.push(`o.id = ANY($${idx++})`);
    values.push(body.orderId);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM orders o ${where}`,
    values,
  );
  values.push(limit, offset);
  const listRes = await query(
    `SELECT o.*, u.nickname, u.avatar, u.user_group_name, b.package_name, b.cover
     FROM orders o
     LEFT JOIN app_user u ON u.id = o.buy_user_id
     LEFT JOIN bag b ON b.id = o.grab_bag_id
     ${where}
     ORDER BY o.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    values,
  );
  const lists = await Promise.all(listRes.rows.map(mapOrder));
  return { total: Number(countRes.rows[0]?.count || 0), lists };
}

export async function handleOrderCreateOrUpdate(body: Record<string, unknown>) {
  if (!body.id) return null;
  await query(`UPDATE orders SET updated_at = NOW() WHERE id = $1`, [body.id]);
  return null;
}

export async function handleOrderBatchCreateLogistics(
  body: Record<string, unknown>,
) {
  const orderIds = (body.orderId as string[]) || [];
  for (const orderId of orderIds) {
    const orderRes = await query(
      `SELECT o.*, u.id AS uid FROM orders o
       LEFT JOIN app_user u ON u.id = o.buy_user_id WHERE o.id = $1`,
      [orderId],
    );
    if (!orderRes.rowCount) continue;
    const order = orderRes.rows[0];
    const logisticsId = newId('log');
    const addrRes = await query(
      `SELECT * FROM user_address WHERE user_id = $1 ORDER BY is_default DESC LIMIT 1`,
      [order.buy_user_id],
    );
    const addr = addrRes.rows[0];
    await query(
      `INSERT INTO logistics (id, user_id, order_ids, status, consignee, phone_number,
       province, city, area, address, zipcode, price)
       VALUES ($1,$2,$3,2,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        logisticsId,
        order.buy_user_id,
        orderId,
        addr?.consignee || '',
        addr?.phone_number || '',
        addr?.province || '',
        addr?.city || '',
        addr?.area || '',
        addr?.address || '',
        addr?.zipcode || '',
        0,
      ],
    );
    await query(
      `UPDATE orders SET logistics_id = $2, status = 5, updated_at = NOW() WHERE id = $1`,
      [orderId, logisticsId],
    );
  }
  return null;
}

async function mapOrder(row: Record<string, unknown>) {
  const orderId = toStr(row.id);
  const lotteryRes = await query(
    `SELECT * FROM order_lottery_result WHERE order_id = $1`,
    [orderId],
  );
  return {
    id: orderId,
    logisticsId: toStr(row.logistics_id),
    grabBagId: toStr(row.grab_bag_id),
    buyUserId: toStr(row.buy_user_id),
    transactionId: toStr(row.transaction_id),
    totalCount: toNumStr(row.total_count),
    totalPrice: toNumStr(row.total_price),
    price: toNumStr(row.price),
    status: Number(row.status),
    grabBagIndex: Array.isArray(row.grab_bag_index)
      ? row.grab_bag_index
      : [],
    createdAt: formatTime(row.created_at),
    updatedAt: formatTime(row.updated_at),
    lotteryResult: lotteryRes.rows.map((lr) => ({
      grabBagItemId: toStr(lr.grab_bag_item_id),
      grabBagIndexId: toStr(lr.grab_bag_index_id),
      index: Number(lr.index_no),
      itemName: toStr(lr.item_name),
      itemCover: toStr(lr.item_cover),
    })),
    user: {
      id: toStr(row.buy_user_id),
      nickname: toStr(row.nickname),
      avatar: toStr(row.avatar),
      tags: [],
      userGroup: toStr(row.user_group_name),
    },
    bagInfo: {
      id: toStr(row.grab_bag_id),
      packageName: toStr(row.package_name),
      cover: toStr(row.cover),
      cost: '0',
    },
  };
}
