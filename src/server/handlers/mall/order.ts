import { query } from '../../db';
import { formatTime, newId, toNumStr, toStr } from '../../response';
import {
  mallPaginate,
  ORDER_STATUS_FROM_DB,
  ORDER_STATUS_TO_DB,
  parseOrderStatusFilter,
} from '../../mall-response';

export async function handleMallOrderList(
  userId: string,
  params: Record<string, string>,
) {
  const { limit, offset, current, size } = mallPaginate(
    params.page,
    params.size,
    params.limit,
  );
  const conditions = ['o.buy_user_id = $1'];
  const values: unknown[] = [userId];
  let idx = 2;

  const statuses = parseOrderStatusFilter(params.status);
  if (statuses) {
    conditions.push(`o.status = ANY($${idx++})`);
    values.push(statuses);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const countRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM orders o ${where}`,
    values,
  );
  const total = Number(countRes.rows[0]?.count || 0);
  values.push(limit, offset);

  const listRes = await query(
    `SELECT o.*, b.package_name, b.cover
     FROM orders o
     LEFT JOIN bag b ON b.id = o.grab_bag_id
     ${where}
     ORDER BY o.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    values,
  );

  const items = await Promise.all(listRes.rows.map((row) => mapMallOrder(row)));
  return {
    items,
    total,
    page: current,
    limit: size,
    totalPages: Math.ceil(total / size) || 0,
  };
}

export async function handleMallOrderDetail(userId: string, orderId: string) {
  const res = await query(
    `SELECT o.*, b.package_name, b.cover
     FROM orders o
     LEFT JOIN bag b ON b.id = o.grab_bag_id
     WHERE o.id = $1 AND o.buy_user_id = $2`,
    [orderId, userId],
  );
  if (!res.rowCount) return null;
  return mapMallOrder(res.rows[0], true);
}

export async function handleMallOrderCreate(
  userId: string,
  body: Record<string, unknown>,
) {
  const items = (body.items as Record<string, unknown>[]) || [];
  const addressId = String(body.addressId || '');
  if (!items.length) return { error: '订单商品不能为空' };
  if (!addressId) return { error: 'addressId 不能为空' };

  const addrRes = await query(
    `SELECT * FROM user_address WHERE id = $1 AND user_id = $2`,
    [addressId, userId],
  );
  if (!addrRes.rowCount) return { error: '收货地址不存在' };

  const orderIds: string[] = [];
  let totalAmount = 0;

  for (const item of items) {
    const productId = String(item.productId || item.goodsId || '');
    const quantity = Math.max(1, Number(item.quantity) || 1);
    if (!productId) continue;

    const bagRes = await query('SELECT * FROM bag WHERE id = $1', [productId]);
    if (!bagRes.rowCount) continue;
    const bag = bagRes.rows[0];
    const price = Number(bag.price || 0);
    const orderId = newId('order');
    const orderTotal = price * quantity;

    await query(
      `INSERT INTO orders (id, grab_bag_id, buy_user_id, total_count, total_price, price, status)
       VALUES ($1, $2, $3, $4, $5, $6, 1)`,
      [orderId, productId, userId, quantity, orderTotal, price],
    );
    orderIds.push(orderId);
    totalAmount += orderTotal;
  }

  if (!orderIds.length) return { error: '无效的商品' };

  return {
    orderIds,
    totalAmount,
    status: 'PENDING',
  };
}

export async function handleMallOrderUpdate(
  userId: string,
  orderId: string,
  body: Record<string, unknown>,
) {
  const res = await query(
    `SELECT * FROM orders WHERE id = $1 AND buy_user_id = $2`,
    [orderId, userId],
  );
  if (!res.rowCount) return { error: '订单不存在' };

  const status = String(body.status || '').toUpperCase();
  if (status === 'CANCELLED') {
    const currentStatus = Number(res.rows[0].status);
    if (currentStatus !== 1) return { error: '仅待支付订单可取消' };
    await query(
      `UPDATE orders SET status = 4, updated_at = NOW() WHERE id = $1`,
      [orderId],
    );
    return { id: orderId, status: 'CANCELLED' };
  }

  const dbStatus = ORDER_STATUS_TO_DB[status];
  if (dbStatus !== undefined) {
    await query(
      `UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1`,
      [orderId, dbStatus],
    );
    return { id: orderId, status };
  }

  return { error: '无效的状态' };
}

export async function handleMallOrderComment(
  userId: string,
  orderId: string,
  body: Record<string, unknown>,
) {
  const orderRes = await query(
    `SELECT * FROM orders WHERE id = $1 AND buy_user_id = $2`,
    [orderId, userId],
  );
  if (!orderRes.rowCount) return { error: '订单不存在' };
  const order = orderRes.rows[0];
  if (![2, 7, 9].includes(Number(order.status))) {
    return { error: '当前订单状态不可评价' };
  }

  const commentId = newId('comment');
  await query(
    `INSERT INTO bag_comment (id, bag_id, user_id, order_id, rating, content, images)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      commentId,
      order.grab_bag_id,
      userId,
      orderId,
      Number(body.rating) || 5,
      body.content || '',
      body.images ? JSON.stringify(body.images) : '[]',
    ],
  );
  return { id: commentId };
}

export async function handleMallOrderPay(userId: string, orderId: string) {
  const res = await query(
    `SELECT * FROM orders WHERE id = $1 AND buy_user_id = $2`,
    [orderId, userId],
  );
  if (!res.rowCount) return { error: '订单不存在' };
  if (Number(res.rows[0].status) !== 1) return { error: '订单状态不可支付' };

  await query(
    `UPDATE orders SET status = 2, transaction_id = $2, updated_at = NOW() WHERE id = $1`,
    [orderId, `mock_tx_${Date.now()}`],
  );

  return {
    orderId,
    payParams: {
      timeStamp: String(Math.floor(Date.now() / 1000)),
      nonceStr: newId('nonce'),
      package: `prepay_id=mock_${orderId}`,
      signType: 'RSA',
      paySign: 'mock_sign',
    },
  };
}

export async function handleMallShipments(
  userId: string,
  params: Record<string, string>,
) {
  const { limit, offset, current, size } = mallPaginate(
    params.page,
    params.size,
    params.limit,
  );
  const conditions = ['l.user_id = $1'];
  const values: unknown[] = [userId];
  let idx = 2;

  if (params.status) {
    const statusMap: Record<string, number> = {
      PENDING: 2,
      SHIPPED: 3,
      SIGNED: 4,
    };
    const mapped = statusMap[String(params.status).toUpperCase()];
    if (mapped) {
      conditions.push(`l.status = $${idx++}`);
      values.push(mapped);
    }
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const countRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM logistics l ${where}`,
    values,
  );
  const total = Number(countRes.rows[0]?.count || 0);
  values.push(limit, offset);

  const listRes = await query(
    `SELECT l.*, d.delivery_name
     FROM logistics l
     LEFT JOIN delivery d ON d.delivery_id = l.delivery_id
     ${where}
     ORDER BY l.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    values,
  );

  return {
    items: listRes.rows.map((row) => ({
      id: toStr(row.id),
      trackingNumber: toStr(row.tracking_number),
      deliveryName: toStr(row.delivery_name),
      status: Number(row.status),
      consignee: toStr(row.consignee),
      phoneNumber: toStr(row.phone_number),
      province: toStr(row.province),
      city: toStr(row.city),
      area: toStr(row.area),
      address: toStr(row.address),
      createdAt: formatTime(row.created_at),
      updatedAt: formatTime(row.updated_at),
    })),
    total,
    page: current,
    limit: size,
    totalPages: Math.ceil(total / size) || 0,
  };
}

async function mapMallOrder(row: Record<string, unknown>, withDetail = false) {
  const orderId = toStr(row.id);
  const statusNum = Number(row.status);
  const status = ORDER_STATUS_FROM_DB[statusNum] || 'PENDING';

  let address = null;
  let logistics = null;

  if (withDetail) {
    const addrRes = await query(
      `SELECT * FROM user_address WHERE user_id = $1 ORDER BY is_default DESC LIMIT 1`,
      [row.buy_user_id],
    );
    if (addrRes.rowCount) {
      const a = addrRes.rows[0];
      address = {
        name: toStr(a.consignee),
        phone: toStr(a.phone_number),
        province: toStr(a.province),
        city: toStr(a.city),
        district: toStr(a.area),
        detail: toStr(a.address),
      };
    }
    if (row.logistics_id) {
      const logRes = await query(
        `SELECT l.*, d.delivery_name FROM logistics l
         LEFT JOIN delivery d ON d.delivery_id = l.delivery_id
         WHERE l.id = $1`,
        [row.logistics_id],
      );
      if (logRes.rowCount) {
        const l = logRes.rows[0];
        logistics = {
          trackingNumber: toStr(l.tracking_number),
          deliveryName: toStr(l.delivery_name),
          status: Number(l.status),
        };
      }
    }
  }

  return {
    id: orderId,
    productId: toStr(row.grab_bag_id),
    status,
    statusCode: statusNum,
    totalCount: Number(row.total_count || 1),
    totalPrice: toNumStr(row.total_price),
    price: toNumStr(row.price),
    remark: '',
    createdAt: formatTime(row.created_at),
    updatedAt: formatTime(row.updated_at),
    product: {
      id: toStr(row.grab_bag_id),
      name: toStr(row.package_name),
      image: toStr(row.cover),
    },
    ...(withDetail ? { address, logistics } : {}),
  };
}
