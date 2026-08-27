import { query } from '../../db';
import { formatTime, toNumStr, toStr } from '../../response';
import { mallPaginate } from '../../mall-response';

export async function handleMallBanners() {
  const res = await query(
    `SELECT * FROM banner WHERE status = 1 ORDER BY sort ASC, created_at DESC`,
  );
  return {
    items: res.rows.map((row) => ({
      id: toStr(row.id),
      imageUrl: toStr(row.image_url),
      linkUrl: toStr(row.link_url),
      sort: Number(row.sort || 0),
    })),
  };
}

export async function handleMallBagCategory() {
  const res = await query(
    `SELECT * FROM bag_category ORDER BY created_at ASC`,
  );
  return {
    categories: res.rows.map((row) => ({
      id: toStr(row.id),
      name: toStr(row.category_name),
      icon: toStr(row.icon),
      status: Number(row.status ?? 1),
    })),
  };
}

export async function handleMallBagList(params: Record<string, string>) {
  const { limit, offset, current, size } = mallPaginate(
    params.page,
    params.size,
    params.limit,
  );
  const conditions = ['b.status = true'];
  const values: unknown[] = [];
  let idx = 1;

  if (params.categoryId) {
    conditions.push(`b.category_id = $${idx++}`);
    values.push(params.categoryId);
  }
  const where = `WHERE ${conditions.join(' AND ')}`;

  let orderBy = 'b.created_at DESC';
  if (params.sort === 'price_asc') orderBy = 'b.price ASC';
  else if (params.sort === 'price_desc') orderBy = 'b.price DESC';
  else if (params.sort === 'sales_desc') orderBy = 'sold_count DESC';

  const countRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM bag b ${where}`,
    values,
  );
  const total = Number(countRes.rows[0]?.count || 0);
  values.push(limit, offset);

  const listRes = await query(
    `SELECT b.*, c.category_name,
      COALESCE((SELECT COUNT(*)::int FROM orders o
        WHERE o.grab_bag_id = b.id AND o.status IN (2,5,6,7,9)), 0) AS sold_count
     FROM bag b
     LEFT JOIN bag_category c ON c.id = b.category_id
     ${where}
     ORDER BY ${orderBy}
     LIMIT $${idx++} OFFSET $${idx}`,
    values,
  );

  return {
    items: listRes.rows.map(mapBagListItem),
    total,
    page: current,
    size,
    totalPages: Math.ceil(total / size) || 0,
  };
}

export async function handleMallBagSearch(params: Record<string, string>) {
  const { limit, offset, current, size } = mallPaginate(params.page, params.size);
  const keyword = params.keyword || '';
  const conditions = ['b.status = true'];
  const values: unknown[] = [];
  let idx = 1;

  if (keyword) {
    conditions.push(`b.package_name ILIKE $${idx++}`);
    values.push(`%${keyword}%`);
  }
  const where = `WHERE ${conditions.join(' AND ')}`;

  let orderBy = 'b.created_at DESC';
  if (params.sort === 'price_asc') orderBy = 'b.price ASC';
  else if (params.sort === 'price_desc') orderBy = 'b.price DESC';
  else if (params.sort === 'sales_desc') orderBy = 'sold_count DESC';

  const countRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM bag b ${where}`,
    values,
  );
  const total = Number(countRes.rows[0]?.count || 0);
  values.push(limit, offset);

  const listRes = await query(
    `SELECT b.*, c.category_name,
      COALESCE((SELECT COUNT(*)::int FROM orders o
        WHERE o.grab_bag_id = b.id AND o.status IN (2,5,6,7,9)), 0) AS sold_count
     FROM bag b
     LEFT JOIN bag_category c ON c.id = b.category_id
     ${where}
     ORDER BY ${orderBy}
     LIMIT $${idx++} OFFSET $${idx}`,
    values,
  );

  return {
    items: listRes.rows.map(mapBagListItem),
    total,
    page: current,
    size,
    totalPages: Math.ceil(total / size) || 0,
  };
}

export async function handleMallBagDetail(params: Record<string, string>) {
  const id = params.id;
  if (!id) return null;

  const bagRes = await query(
    `SELECT b.*, c.category_name,
      COALESCE((SELECT COUNT(*)::int FROM orders o
        WHERE o.grab_bag_id = b.id AND o.status IN (2,5,6,7,9)), 0) AS sold_count
     FROM bag b
     LEFT JOIN bag_category c ON c.id = b.category_id
     WHERE b.id = $1`,
    [id],
  );
  if (!bagRes.rowCount) return null;
  const bag = bagRes.rows[0];

  const itemsRes = await query(
    `SELECT bi.*, il.level_name FROM bag_item bi
     LEFT JOIN item_level il ON il.id = bi.level_id
     WHERE bi.grab_bag_id = $1 AND bi.status = 1
     ORDER BY bi.sort ASC`,
    [id],
  );

  const commentRes = await query(
    `SELECT bc.*, u.nickname, u.avatar
     FROM bag_comment bc
     LEFT JOIN app_user u ON u.id = bc.user_id
     WHERE bc.bag_id = $1
     ORDER BY bc.created_at DESC LIMIT 5`,
    [id],
  );
  const commentCountRes = await query<{ count: string; avg: string }>(
    `SELECT COUNT(*)::text AS count, COALESCE(AVG(rating), 5)::text AS avg
     FROM bag_comment WHERE bag_id = $1`,
    [id],
  );
  const totalComments = Number(commentCountRes.rows[0]?.count || 0);
  const avgRating = Number(commentCountRes.rows[0]?.avg || 5);
  const goodRate = totalComments
    ? Math.round((avgRating / 5) * 100)
    : 100;

  const skus = itemsRes.rows.map((item) => ({
    id: toStr(item.id),
    name: toStr(item.item_name),
    price: toNumStr(item.refer_price || bag.price),
    stock: Number(item.surplus_count || 0),
    coverImage: toStr(item.item_cover || bag.cover),
  }));

  return {
    id: toStr(bag.id),
    name: toStr(bag.package_name),
    coverImage: toStr(bag.cover),
    images: bag.cover ? [toStr(bag.cover)] : [],
    price: toNumStr(bag.price),
    originalPrice: toNumStr(bag.price),
    soldCount: Number(bag.sold_count || 0),
    totalCount: Number(bag.total_package || 0),
    categoryId: toStr(bag.category_id),
    categoryName: toStr(bag.category_name),
    tags: [],
    specification: skus.map((s) => s.name),
    skus,
    detail: `<p>${toStr(bag.package_name)}</p>`,
    comments: {
      total: totalComments,
      goodRate,
      items: commentRes.rows.map((c) => ({
        id: toStr(c.id),
        rating: Number(c.rating),
        content: toStr(c.content),
        nickname: toStr(c.nickname),
        avatar: toStr(c.avatar),
        createdAt: formatTime(c.created_at),
      })),
    },
  };
}

export async function handleMallBagComments(params: Record<string, string>) {
  const bagId = params.bagId || params.id;
  if (!bagId) return { items: [], total: 0, page: 1, size: 10, totalPages: 0 };

  const { limit, offset, current, size } = mallPaginate(params.page, params.size);
  const countRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM bag_comment WHERE bag_id = $1`,
    [bagId],
  );
  const total = Number(countRes.rows[0]?.count || 0);
  const listRes = await query(
    `SELECT bc.*, u.nickname, u.avatar
     FROM bag_comment bc
     LEFT JOIN app_user u ON u.id = bc.user_id
     WHERE bc.bag_id = $1
     ORDER BY bc.created_at DESC
     LIMIT $2 OFFSET $3`,
    [bagId, limit, offset],
  );

  return {
    items: listRes.rows.map((c) => ({
      id: toStr(c.id),
      bagId: toStr(c.bag_id),
      rating: Number(c.rating),
      content: toStr(c.content),
      images: Array.isArray(c.images) ? c.images : [],
      nickname: toStr(c.nickname),
      avatar: toStr(c.avatar),
      createdAt: formatTime(c.created_at),
    })),
    total,
    page: current,
    size,
    totalPages: Math.ceil(total / size) || 0,
  };
}

export async function handleMallBagCommentDetail(params: Record<string, string>) {
  const id = params.id;
  if (!id) return null;

  const res = await query(
    `SELECT bc.*, u.nickname, u.avatar, b.package_name
     FROM bag_comment bc
     LEFT JOIN app_user u ON u.id = bc.user_id
     LEFT JOIN bag b ON b.id = bc.bag_id
     WHERE bc.id = $1`,
    [id],
  );
  if (!res.rowCount) return null;
  const c = res.rows[0];
  return {
    id: toStr(c.id),
    bagId: toStr(c.bag_id),
    productName: toStr(c.package_name),
    rating: Number(c.rating),
    content: toStr(c.content),
    images: Array.isArray(c.images) ? c.images : [],
    nickname: toStr(c.nickname),
    avatar: toStr(c.avatar),
    createdAt: formatTime(c.created_at),
  };
}

function mapBagListItem(row: Record<string, unknown>) {
  return {
    id: toStr(row.id),
    name: toStr(row.package_name),
    coverImage: toStr(row.cover),
    price: toNumStr(row.price),
    originalPrice: toNumStr(row.price),
    soldCount: Number(row.sold_count || 0),
    totalCount: Number(row.total_package || 0),
    categoryId: toStr(row.category_id),
    categoryName: toStr(row.category_name),
    tags: [] as string[],
  };
}
