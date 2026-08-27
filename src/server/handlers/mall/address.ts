import { query } from '../../db';
import { formatTime, newId, toStr } from '../../response';

function mapAddress(row: Record<string, unknown>) {
  return {
    id: toStr(row.id),
    consignee: toStr(row.consignee),
    phoneNumber: toStr(row.phone_number),
    province: toStr(row.province),
    city: toStr(row.city),
    area: toStr(row.area),
    address: toStr(row.address),
    zipcode: toStr(row.zipcode),
    isDefault: Boolean(Number(row.is_default)),
    createdAt: formatTime(row.created_at),
    updatedAt: formatTime(row.updated_at),
  };
}

export async function handleMallAddressList(userId: string) {
  const res = await query(
    `SELECT * FROM user_address
     WHERE user_id = $1 AND status = 1
     ORDER BY is_default DESC, created_at DESC`,
    [userId],
  );
  return { items: res.rows.map(mapAddress) };
}

export async function handleMallAddressDetail(userId: string, addressId: string) {
  const res = await query(
    `SELECT * FROM user_address WHERE id = $1 AND user_id = $2 AND status = 1`,
    [addressId, userId],
  );
  if (!res.rowCount) return null;
  return mapAddress(res.rows[0]);
}

export async function handleMallAddressCreate(
  userId: string,
  body: Record<string, unknown>,
) {
  const id = newId('addr');
  const isDefault = Boolean(body.isDefault);

  if (isDefault) {
    await query(
      `UPDATE user_address SET is_default = 0 WHERE user_id = $1`,
      [userId],
    );
  }

  await query(
    `INSERT INTO user_address
     (id, user_id, consignee, phone_number, province, city, area, address, zipcode, is_default, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1)`,
    [
      id,
      userId,
      body.consignee || body.name || '',
      body.phoneNumber || body.phone || '',
      body.province || '',
      body.city || '',
      body.area || body.district || '',
      body.address || body.detail || '',
      body.zipcode || '',
      isDefault ? 1 : 0,
    ],
  );
  return mapAddress(
    (
      await query('SELECT * FROM user_address WHERE id = $1', [id])
    ).rows[0],
  );
}

export async function handleMallAddressUpdate(
  userId: string,
  addressId: string,
  body: Record<string, unknown>,
) {
  const exists = await query(
    `SELECT id FROM user_address WHERE id = $1 AND user_id = $2 AND status = 1`,
    [addressId, userId],
  );
  if (!exists.rowCount) return { error: '地址不存在' };

  const isDefault = body.isDefault;
  if (isDefault === true) {
    await query(
      `UPDATE user_address SET is_default = 0 WHERE user_id = $1`,
      [userId],
    );
  }

  await query(
    `UPDATE user_address SET
      consignee = COALESCE($3, consignee),
      phone_number = COALESCE($4, phone_number),
      province = COALESCE($5, province),
      city = COALESCE($6, city),
      area = COALESCE($7, area),
      address = COALESCE($8, address),
      zipcode = COALESCE($9, zipcode),
      is_default = COALESCE($10, is_default),
      updated_at = NOW()
     WHERE id = $1 AND user_id = $2`,
    [
      addressId,
      userId,
      body.consignee ?? body.name ?? null,
      body.phoneNumber ?? body.phone ?? null,
      body.province ?? null,
      body.city ?? null,
      body.area ?? body.district ?? null,
      body.address ?? body.detail ?? null,
      body.zipcode ?? null,
      isDefault !== undefined ? (isDefault ? 1 : 0) : null,
    ],
  );

  return handleMallAddressDetail(userId, addressId);
}

export async function handleMallAddressDelete(userId: string, addressId: string) {
  const res = await query(
    `UPDATE user_address SET status = 0, updated_at = NOW()
     WHERE id = $1 AND user_id = $2 RETURNING id`,
    [addressId, userId],
  );
  if (!res.rowCount) return { error: '地址不存在' };
  return { id: addressId };
}
