import { query } from '../../db';
import { formatTime, newId, toNumStr, toStr } from '../../response';

export async function handleMallGetMyItems(userId: string) {
  const res = await query(
    `SELECT ci.*, b.package_name, b.cover, b.price
     FROM cart_item ci
     LEFT JOIN bag b ON b.id = ci.good_id
     WHERE ci.user_id = $1
     ORDER BY ci.updated_at DESC`,
    [userId],
  );

  const items = res.rows.map((row) => ({
    id: toStr(row.id),
    goodId: toStr(row.good_id),
    skuId: toStr(row.sku_id),
    quantity: Number(row.quantity || 1),
    checked: Boolean(row.checked),
    specifications: Array.isArray(row.specifications) ? row.specifications : [],
    product: {
      id: toStr(row.good_id),
      name: toStr(row.package_name),
      coverImage: toStr(row.cover),
      price: toNumStr(row.price),
    },
    updatedAt: formatTime(row.updated_at),
  }));

  return {
    items,
    total: items.length,
    checkedCount: items.filter((i) => i.checked).length,
  };
}

export async function handleMallCartAdd(
  userId: string,
  body: Record<string, unknown>,
) {
  const goodId = String(body.goodId || '');
  const skuId = body.skuId ? String(body.skuId) : '';
  const quantity = Math.max(1, Number(body.quantity) || 1);
  if (!goodId) return { error: 'goodId 不能为空' };

  const existing = await query(
    `SELECT id, quantity FROM cart_item
     WHERE user_id = $1 AND good_id = $2 AND COALESCE(sku_id, '') = $3`,
    [userId, goodId, skuId],
  );

  if (existing.rowCount) {
    const cartId = toStr(existing.rows[0].id);
    const newQty = Number(existing.rows[0].quantity) + quantity;
    await query(
      `UPDATE cart_item SET quantity = $2, updated_at = NOW() WHERE id = $1`,
      [cartId, newQty],
    );
    return { id: cartId, quantity: newQty };
  }

  const id = newId('cart');
  await query(
    `INSERT INTO cart_item (id, user_id, good_id, sku_id, quantity, checked, specifications)
     VALUES ($1, $2, $3, $4, $5, true, $6)`,
    [
      id,
      userId,
      goodId,
      skuId || null,
      quantity,
      body.specifications ? JSON.stringify(body.specifications) : null,
    ],
  );
  return { id, quantity };
}

export async function handleMallCartUpdate(
  userId: string,
  body: Record<string, unknown>,
) {
  const id = String(body.id || '');
  if (!id) return { error: 'id 不能为空' };

  const fields: string[] = [];
  const values: unknown[] = [id, userId];
  let idx = 3;

  if (body.quantity !== undefined) {
    fields.push(`quantity = $${idx++}`);
    values.push(Math.max(1, Number(body.quantity) || 1));
  }
  if (body.checked !== undefined) {
    fields.push(`checked = $${idx++}`);
    values.push(Boolean(body.checked));
  }
  if (!fields.length) return { error: '无更新字段' };

  fields.push('updated_at = NOW()');
  const res = await query(
    `UPDATE cart_item SET ${fields.join(', ')}
     WHERE id = $1 AND user_id = $2 RETURNING id`,
    values,
  );
  if (!res.rowCount) return { error: '购物车项不存在' };
  return { id };
}

export async function handleMallCartDelete(
  userId: string,
  body: Record<string, unknown>,
) {
  const id = String(body.id || '');
  const ids = Array.isArray(body.ids) ? body.ids.map(String) : id ? [id] : [];
  if (!ids.length) return { error: 'id 不能为空' };

  await query(
    `DELETE FROM cart_item WHERE user_id = $1 AND id = ANY($2)`,
    [userId, ids],
  );
  return { deleted: ids.length };
}
