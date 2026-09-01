import { getBoxGridState, listBoxLocks, lockBox, unlockBox, verifyUserLock } from '../../arcade/box-lock';
import {
  createFreeDrawOrder,
  executeDraw,
  getDrawJob,
  markDrawJobFailed,
} from '../../arcade/draw-engine';
import { enqueueBagTask } from '../../arcade/draw-queue';
import { checkRateLimit } from '../../arcade/rate-limit';
import { query } from '../../db';
import { mallPaginate } from '../../mall-response';
import { formatTime, toNumStr, toStr } from '../../response';

function mapPrizeItem(row: Record<string, unknown>) {
  return {
    id: toStr(row.id),
    grabBagItemId: toStr(row.grab_bag_item_id),
    name: toStr(row.prize_name),
    photo: toStr(row.prize_photo),
    score: Number(row.prize_score || 0),
    rarity: toStr(row.rarity),
    ownership: toStr(row.ownership),
    isShareable: Boolean(row.is_shareable),
    status: Number(row.prize_status || 1),
    category: toStr(row.prize_category),
    uniqueCategory: toStr(row.unique_category),
    indexNo: Number(row.index_no || 0),
    bagId: toStr(row.grab_bag_id),
    orderId: toStr(row.order_id),
    createdAt: formatTime(row.created_at),
  };
}

export async function handleArcadeHome() {
  const featured = await query(
    `SELECT b.*, c.category_name
     FROM bag b
     LEFT JOIN bag_category c ON c.id = b.category_id
     WHERE b.is_arcade = TRUE AND b.is_home_featured = TRUE AND b.status = TRUE
     ORDER BY b.updated_at DESC LIMIT 1`,
  );
  const categories = await query(
    `SELECT bc.*, COUNT(b.id)::int AS machine_count
     FROM bag_category bc
     LEFT JOIN bag b ON b.category_id = bc.id AND b.is_arcade = TRUE AND b.status = TRUE
     WHERE COALESCE(bc.status, 1) = 1
     GROUP BY bc.id
     ORDER BY bc.created_at ASC`,
  );
  const machine = featured.rows[0];
  return {
    featuredMachine: machine
      ? {
          id: toStr(machine.id),
          name: toStr(machine.package_name),
          cover: toStr(machine.cover),
          playMode: toStr(machine.play_mode) || 'shake',
          price: toNumStr(machine.price),
          totalPackage: Number(machine.total_package || 0),
          categoryId: toStr(machine.category_id),
          categoryName: toStr(machine.category_name),
        }
      : null,
    categories: categories.rows.map((row) => ({
      id: toStr(row.id),
      name: toStr(row.category_name),
      icon: toStr(row.icon),
      machineCount: Number(row.machine_count || 0),
    })),
  };
}

export async function handleArcadeMachineList(params: Record<string, string>) {
  const conditions = ['b.is_arcade = TRUE', 'b.status = TRUE'];
  const values: unknown[] = [];
  let idx = 1;
  if (params.categoryId) {
    conditions.push(`b.category_id = $${idx++}`);
    values.push(params.categoryId);
  }
  if (params.playMode) {
    conditions.push(`b.play_mode = $${idx++}`);
    values.push(params.playMode);
  }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const res = await query(
    `SELECT b.*, c.category_name
     FROM bag b
     LEFT JOIN bag_category c ON c.id = b.category_id
     ${where}
     ORDER BY b.is_home_featured DESC, b.created_at DESC`,
    values,
  );
  return {
    items: res.rows.map((row) => ({
      id: toStr(row.id),
      name: toStr(row.package_name),
      cover: toStr(row.cover),
      playMode: toStr(row.play_mode) || 'shake',
      price: toNumStr(row.price),
      totalPackage: Number(row.total_package || 0),
      categoryId: toStr(row.category_id),
      categoryName: toStr(row.category_name),
      isHomeFeatured: Boolean(row.is_home_featured),
    })),
  };
}

export async function handleArcadeMachineDetail(bagId: string) {
  const res = await query(
    `SELECT b.*, c.category_name
     FROM bag b
     LEFT JOIN bag_category c ON c.id = b.category_id
     WHERE b.id = $1 AND b.is_arcade = TRUE`,
    [bagId],
  );
  if (!res.rowCount) return null;
  const row = res.rows[0];
  const grid = await getBoxGridState(bagId);
  const itemsRes = await query(
    `SELECT bi.*, il.level_name
     FROM bag_item bi
     LEFT JOIN item_level il ON il.id = bi.level_id
     WHERE bi.grab_bag_id = $1 AND bi.status = 1
     ORDER BY bi.sort ASC`,
    [bagId],
  );
  return {
    id: toStr(row.id),
    name: toStr(row.package_name),
    cover: toStr(row.cover),
    playMode: toStr(row.play_mode) || 'shake',
    price: toNumStr(row.price),
    totalPackage: Number(row.total_package || 0),
    categoryId: toStr(row.category_id),
    categoryName: toStr(row.category_name),
    prizes: itemsRes.rows.map((item) => ({
      id: toStr(item.id),
      name: toStr(item.item_name),
      photo: toStr(item.item_cover),
      score: Number(item.prize_score || 0),
      rarity: toStr(item.rarity) || 'normal',
      ownership: toStr(item.ownership),
      isShareable: Boolean(item.is_shareable),
      category: toStr(item.prize_category),
      uniqueCategory: toStr(item.unique_category),
      levelName: toStr(item.level_name),
      surplusCount: Number(item.surplus_count || 0),
    })),
    boxGrid: grid,
  };
}

export async function handleArcadeBoxLocks(bagId: string) {
  const locks = await listBoxLocks(bagId);
  const grid = await getBoxGridState(bagId);
  return { locks, boxGrid: grid };
}

export async function handleArcadeBoxLock(
  userId: string,
  clientIp: string,
  body: Record<string, unknown>,
) {
  if (!checkRateLimit(`lock:${clientIp}`, 4, 1000)) {
    return { error: '锁盒操作过于频繁，请稍后再试' };
  }
  const bagId = String(body.bagId || '');
  const indexNo = Number(body.indexNo);
  if (!bagId || Number.isNaN(indexNo)) return { error: '参数不完整' };
  return lockBox({ bagId, indexNo, userId, clientIp });
}

export async function handleArcadeBoxUnlock(
  userId: string,
  body: Record<string, unknown>,
) {
  const bagId = String(body.bagId || '');
  const indexNo = Number(body.indexNo);
  if (!bagId || Number.isNaN(indexNo)) return { error: '参数不完整' };
  return unlockBox({ bagId, indexNo, userId });
}

export async function handleArcadeDraw(
  userId: string,
  clientIp: string,
  body: Record<string, unknown>,
) {
  if (!checkRateLimit(`order:${clientIp}`, 1, 1000)) {
    return { error: '下单过于频繁，请稍后再试' };
  }

  const bagId = String(body.bagId || '');
  const indexNo =
    body.indexNo === undefined || body.indexNo === null || body.indexNo === ''
      ? undefined
      : Number(body.indexNo);
  if (!bagId) return { error: 'bagId 不能为空' };

  const bagRes = await query(
    `SELECT play_mode FROM bag WHERE id = $1 AND is_arcade = TRUE AND status = TRUE`,
    [bagId],
  );
  if (!bagRes.rowCount) return { error: '娱乐场抽盒机不存在' };
  const playMode = toStr(bagRes.rows[0].play_mode) || 'shake';

  if (playMode === 'pick') {
    if (indexNo === undefined || Number.isNaN(indexNo)) {
      return { error: '选盒模式需要先锁定盒子' };
    }
    const locked = await verifyUserLock(bagId, indexNo, userId);
    if (!locked) return { error: '请先锁定该盒子' };
  }

  const orderInfo = await createFreeDrawOrder(userId, bagId, indexNo);
  if ('error' in orderInfo) return orderInfo;

  try {
    const result = await enqueueBagTask(bagId, () =>
      executeDraw({
        userId,
        bagId,
        orderId: orderInfo.orderId,
        jobId: orderInfo.jobId,
        indexNo,
        playMode,
      }),
    );
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : '开奖失败';
    await markDrawJobFailed(orderInfo.jobId, message);
    return { error: message };
  }
}

export async function handleArcadeDrawStatus(jobId: string, userId: string) {
  const job = await getDrawJob(jobId);
  if (!job || toStr(job.user_id) !== userId) return null;
  return {
    jobId,
    status: Number(job.status),
    errorMessage: toStr(job.error_message),
    result: job.result_json || null,
    processedAt: job.processed_at ? formatTime(job.processed_at) : '',
  };
}

export async function handleArcadeCabinet(
  userId: string,
  params: Record<string, string>,
) {
  const { limit, offset, current, size } = mallPaginate(params.page, params.size);
  const conditions = ['user_id = $1'];
  const values: unknown[] = [userId];
  let idx = 2;

  if (params.category) {
    conditions.push(`prize_category = $${idx++}`);
    values.push(params.category);
  }
  if (params.rarity) {
    conditions.push(`rarity = $${idx++}`);
    values.push(params.rarity);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const countRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM user_prize_cabinet ${where}`,
    values,
  );
  const total = Number(countRes.rows[0]?.count || 0);
  values.push(limit, offset);

  const listRes = await query(
    `SELECT * FROM user_prize_cabinet ${where}
     ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
    values,
  );

  return {
    items: listRes.rows.map(mapPrizeItem),
    total,
    page: current,
    size,
    totalPages: Math.ceil(total / size) || 0,
    totalScore: listRes.rows.reduce(
      (sum, row) => sum + Number(row.prize_score || 0),
      0,
    ),
  };
}

export async function handleArcadeCabinetDetail(
  userId: string,
  cabinetId: string,
) {
  const res = await query(
    `SELECT * FROM user_prize_cabinet WHERE id = $1 AND user_id = $2`,
    [cabinetId, userId],
  );
  if (!res.rowCount) return null;
  return mapPrizeItem(res.rows[0]);
}
