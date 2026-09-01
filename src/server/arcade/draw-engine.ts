import { PoolClient } from 'pg';
import { markBoxesSold } from '../box/box-service';
import { query, withTransaction } from '../db';
import { newId, toStr } from '../response';

export type DrawResult = {
  orderId: string;
  jobId: string;
  indexNo: number;
  prize: {
    cabinetId: string;
    grabBagItemId: string;
    name: string;
    photo: string;
    score: number;
    rarity: string;
    ownership: string;
    isShareable: boolean;
    prizeCategory: string;
    uniqueCategory: string;
    levelName: string;
  };
  animation: {
    type: 'shake' | 'pick';
    durationMs: number;
  };
};

type BagItemRow = {
  id: string;
  item_name: string;
  item_cover: string;
  prob_rate: string | number;
  surplus_count: number;
  prize_score: number;
  rarity: string;
  ownership: string;
  is_shareable: boolean;
  prize_category: string;
  unique_category: string;
  level_name: string;
};

async function getTakenIndexes(
  client: PoolClient,
  bagId: string,
): Promise<Set<number>> {
  const res = await client.query<{ index_no: number }>(
    `SELECT index_no FROM grab_bag_index WHERE grab_bag_id = $1`,
    [bagId],
  );
  return new Set(res.rows.map((r) => Number(r.index_no)));
}

async function pickAvailableIndex(
  client: PoolClient,
  bagId: string,
  totalPackage: number,
  preferred?: number,
): Promise<number> {
  const taken = await getTakenIndexes(client, bagId);
  if (preferred !== undefined) {
    if (taken.has(preferred)) {
      throw new Error('该序号已被抽取');
    }
    return preferred;
  }
  for (let i = 1; i <= totalPackage; i += 1) {
    if (!taken.has(i)) return i;
  }
  throw new Error('该福袋已全部抽完');
}

function weightedPick(items: BagItemRow[]): BagItemRow {
  const available = items.filter((item) => Number(item.surplus_count) > 0);
  if (!available.length) throw new Error('赏品库存不足');

  const totalWeight = available.reduce(
    (sum, item) => sum + Number(item.prob_rate || 0),
    0,
  );
  let random = Math.random() * (totalWeight || available.length);
  for (const item of available) {
    random -= Number(item.prob_rate || 1);
    if (random <= 0) return item;
  }
  return available[available.length - 1];
}

async function loadBagItems(
  client: PoolClient,
  bagId: string,
): Promise<BagItemRow[]> {
  const res = await client.query<BagItemRow>(
    `SELECT bi.*, il.level_name
     FROM bag_item bi
     LEFT JOIN item_level il ON il.id = bi.level_id
     WHERE bi.grab_bag_id = $1 AND bi.status = 1
     ORDER BY bi.sort ASC`,
    [bagId],
  );
  return res.rows;
}

export async function executeDraw(params: {
  userId: string;
  bagId: string;
  orderId: string;
  jobId: string;
  indexNo?: number;
  playMode?: string;
}): Promise<DrawResult> {
  const result = await withTransaction(async (client) => {
    const bagRes = await client.query(
      `SELECT * FROM bag WHERE id = $1 AND status = TRUE FOR UPDATE`,
      [params.bagId],
    );
    if (!bagRes.rowCount) throw new Error('抽盒机不存在或已下架');
    const bag = bagRes.rows[0];
    const totalPackage = Number(bag.total_package || 0);
    if (totalPackage <= 0) throw new Error('福袋配置异常');

    const indexNo = await pickAvailableIndex(
      client,
      params.bagId,
      totalPackage,
      params.indexNo,
    );

    const items = await loadBagItems(client, params.bagId);
    const picked = weightedPick(items);

    const indexId = newId('gbi');
    const cabinetId = newId('cabinet');

    await client.query(
      `INSERT INTO grab_bag_index
       (id, grab_bag_id, grab_bag_item_id, user_id, order_id, index_no, status)
       VALUES ($1,$2,$3,$4,$5,$6,1)`,
      [
        indexId,
        params.bagId,
        picked.id,
        params.userId,
        params.orderId,
        indexNo,
      ],
    );

    await client.query(
      `INSERT INTO order_lottery_result
       (order_id, grab_bag_item_id, grab_bag_index_id, index_no, item_name, item_cover)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        params.orderId,
        picked.id,
        indexId,
        indexNo,
        picked.item_name,
        picked.item_cover || '',
      ],
    );

    await client.query(
      `INSERT INTO user_prize_cabinet
       (id, user_id, grab_bag_id, grab_bag_item_id, order_id, grab_bag_index_id,
        index_no, prize_name, prize_photo, prize_score, rarity, ownership,
        is_shareable, prize_status, prize_category, unique_category)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,1,$14,$15)`,
      [
        cabinetId,
        params.userId,
        params.bagId,
        picked.id,
        params.orderId,
        indexId,
        indexNo,
        picked.item_name,
        picked.item_cover || '',
        Number(picked.prize_score || 0),
        toStr(picked.rarity) || 'normal',
        toStr(picked.ownership),
        Boolean(picked.is_shareable),
        toStr(picked.prize_category),
        toStr(picked.unique_category),
      ],
    );

    await client.query(
      `UPDATE bag_item SET send_count = send_count + 1,
       surplus_count = GREATEST(surplus_count - 1, 0), updated_at = NOW()
       WHERE id = $1`,
      [picked.id],
    );

    await client.query(
      `UPDATE orders SET status = 9, grab_bag_index = $2, updated_at = NOW()
       WHERE id = $1`,
      [params.orderId, JSON.stringify([indexNo])],
    );

    await client.query(
      `UPDATE arcade_draw_job SET status = 2, result_json = $2, processed_at = NOW()
       WHERE id = $1`,
      [
        params.jobId,
        JSON.stringify({ indexNo, cabinetId, grabBagItemId: picked.id }),
      ],
    );

    await client.query(
      `UPDATE box_lock SET status = 3, updated_at = NOW()
       WHERE grab_bag_id = $1 AND index_no = $2 AND user_id = $3 AND status = 1`,
      [params.bagId, indexNo, params.userId],
    );

    await client.query(
      `UPDATE app_user SET reward_total = reward_total + 1, buy_total = buy_total + 1,
       updated_at = NOW() WHERE id = $1`,
      [params.userId],
    );

    return {
      orderId: params.orderId,
      jobId: params.jobId,
      indexNo,
      prize: {
        cabinetId,
        grabBagItemId: toStr(picked.id),
        name: toStr(picked.item_name),
        photo: toStr(picked.item_cover),
        score: Number(picked.prize_score || 0),
        rarity: toStr(picked.rarity) || 'normal',
        ownership: toStr(picked.ownership),
        isShareable: Boolean(picked.is_shareable),
        prizeCategory: toStr(picked.prize_category),
        uniqueCategory: toStr(picked.unique_category),
        levelName: toStr(picked.level_name),
      },
      animation: {
        type: (params.playMode === 'pick' ? 'pick' : 'shake') as 'pick' | 'shake',
        durationMs: 2800,
      },
    };
  });

  await markBoxesSold(params.bagId, [result.indexNo]);
  return result;
}

export async function createFreeDrawOrder(
  userId: string,
  bagId: string,
  indexNo?: number,
) {
  const orderId = newId('order');
  const jobId = newId('job');

  const bagRes = await query('SELECT price, play_mode FROM bag WHERE id = $1', [
    bagId,
  ]);
  if (!bagRes.rowCount) return { error: '抽盒机不存在' };

  await query(
    `INSERT INTO orders (id, grab_bag_id, buy_user_id, total_count, total_price, price, status)
     VALUES ($1,$2,$3,1,0,0,2)`,
    [orderId, bagId, userId],
  );

  await query(
    `INSERT INTO arcade_draw_job (id, order_id, grab_bag_id, user_id, index_no, status)
     VALUES ($1,$2,$3,$4,$5,0)`,
    [jobId, orderId, bagId, userId, indexNo ?? null],
  );

  return {
    orderId,
    jobId,
    playMode: toStr(bagRes.rows[0].play_mode) || 'shake',
  };
}

export async function markDrawJobFailed(jobId: string, message: string) {
  await query(
    `UPDATE arcade_draw_job SET status = 3, error_message = $2, processed_at = NOW()
     WHERE id = $1`,
    [jobId, message],
  );
}

export async function getDrawJob(jobId: string) {
  const res = await query(`SELECT * FROM arcade_draw_job WHERE id = $1`, [
    jobId,
  ]);
  return res.rows[0] || null;
}
