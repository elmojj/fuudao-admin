import type { PoolClient } from 'pg';
import {
  markBoxesSold,
  verifyUserBoxLock,
} from '../box/box-service';
import { query, withTransaction } from '../db';
import { newId, toStr } from '../response';
import { grantDrawChances } from '../gacha/chance';
import { grantScore } from '../gacha/score';
import {
  FRAGMENTS_BY_RARITY,
  type Rarity,
} from '../gacha/types';
import { getWeekKey } from '../gacha/utils';
import {
  BAG_DRAW_ERROR,
  type IBagDrawPrize,
  type IBagDrawResult,
} from './bag-draw-types';

type BagRow = {
  id: string;
  total_package: number;
  status: boolean;
  end_time: Date | null;
};

type BagItemRow = {
  id: string;
  item_name: string;
  item_cover: string;
  prob_rate: string | number;
  surplus_count: number;
  prize_score: number;
  rarity: string;
  level_name: string;
};

async function ensureWeekReset(client: PoolClient, userId: string) {
  const weekKey = getWeekKey();
  await client.query(
    `UPDATE app_user
     SET week_draws = 0,
         week_task_points = 0,
         week_max_lucky = 0,
         week_lucky_at = NULL,
         week_key = $2,
         updated_at = NOW()
     WHERE id = $1 AND week_key IS DISTINCT FROM $2`,
    [userId, weekKey],
  );
}

async function getBagMeta(bagId: string): Promise<BagRow | null> {
  const res = await query(`SELECT * FROM bag WHERE id = $1`, [bagId]);
  if (!res.rowCount) return null;
  return res.rows[0] as BagRow;
}

function isBagActive(bag: BagRow) {
  if (!bag.status) return false;
  if (bag.end_time && new Date(bag.end_time).getTime() < Date.now()) return false;
  return true;
}

async function getSoldBoxNos(bagId: string, client?: PoolClient) {
  const runner = client
    ? (sql: string, params: unknown[]) => client.query(sql, params)
    : (sql: string, params: unknown[]) => query(sql, params);

  const fromIndex = await runner(
    `SELECT index_no FROM grab_bag_index WHERE grab_bag_id = $1`,
    [bagId],
  );
  const fromPaid = await runner(
    `SELECT grab_bag_index FROM orders
     WHERE grab_bag_id = $1 AND order_kind = 'bag_pick' AND status = 2`,
    [bagId],
  );

  const sold = new Set<number>();
  for (const row of fromIndex.rows) sold.add(Number(row.index_no));
  for (const row of fromPaid.rows) {
    const boxNos = Array.isArray(row.grab_bag_index)
      ? row.grab_bag_index
      : JSON.parse(String(row.grab_bag_index || '[]'));
    for (const n of boxNos) sold.add(Number(n));
  }
  return sold;
}

async function loadBagItems(client: PoolClient, bagId: string) {
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

function hashBoxSeed(bagId: string, boxNo: number): number {
  const s = `${bagId}:${boxNo}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** 格子奖品由 bagId+boxNo 确定性映射（福袋预分配语义） */
function pickBagItemForBox(
  bagId: string,
  boxNo: number,
  items: BagItemRow[],
): BagItemRow {
  const available = items.filter((item) => Number(item.surplus_count) > 0);
  if (!available.length) throw new Error('赏品库存不足');

  const totalWeight = available.reduce(
    (sum, item) => sum + Number(item.prob_rate || 1),
    0,
  );
  let roll = hashBoxSeed(bagId, boxNo) % totalWeight;
  for (const item of available) {
    roll -= Number(item.prob_rate || 1);
    if (roll < 0) return item;
  }
  return available[available.length - 1]!;
}

function mapBagRarity(rarity: string): Rarity {
  const r = String(rarity || 'normal').toLowerCase();
  if (r.includes('ur') || r === 'legendary') return 'UR';
  if (r.includes('ssr') || r === 'super') return 'SSR';
  if (r.includes('sr') || r === 'rare') return 'SR';
  if (r === 'r') return 'R';
  return 'N';
}

function luckyFromBagItem(item: BagItemRow): number {
  const mapped = mapBagRarity(item.rarity);
  const defaults: Record<Rarity, number> = {
    N: 1,
    R: 3,
    SR: 10,
    SSR: 30,
    UR: 100,
  };
  return Number(item.prize_score) || defaults[mapped];
}

async function applyBagCollection(
  client: PoolClient,
  userId: string,
  itemId: string,
  rarity: Rarity,
): Promise<{ isNew: boolean; isDuplicate: boolean; fragments: number }> {
  const existing = await client.query(
    `SELECT count FROM gacha_collection WHERE user_id = $1 AND item_id = $2`,
    [userId, itemId],
  );

  if (!existing.rowCount) {
    await client.query(
      `INSERT INTO gacha_collection (user_id, item_id, count, first_at, updated_at)
       VALUES ($1, $2, 1, NOW(), NOW())`,
      [userId, itemId],
    );
    return { isNew: true, isDuplicate: false, fragments: 0 };
  }

  const fragments = FRAGMENTS_BY_RARITY[rarity] || 1;
  await client.query(
    `UPDATE gacha_collection
     SET count = count + 1, updated_at = NOW()
     WHERE user_id = $1 AND item_id = $2`,
    [userId, itemId],
  );
  await client.query(
    `UPDATE app_user SET fragments = fragments + $2, updated_at = NOW() WHERE id = $1`,
    [userId, fragments],
  );
  return { isNew: false, isDuplicate: true, fragments };
}

export async function executeBagDraw(
  userId: string,
  bagId: string,
  boxNos: number[],
): Promise<IBagDrawResult | { code: number; message: string }> {
  const uniqueBoxNos = [...new Set(boxNos.map(Number))].filter(
    (n) => !Number.isNaN(n) && n > 0,
  );
  if (!bagId || !uniqueBoxNos.length) {
    return { code: 1, message: '参数不完整' };
  }

  const bag = await getBagMeta(bagId);
  if (!bag || !isBagActive(bag)) {
    return { code: BAG_DRAW_ERROR.BAG_INVALID, message: '福袋不存在或已结束' };
  }

  for (const boxNo of uniqueBoxNos) {
    if (boxNo < 1 || boxNo > Number(bag.total_package)) {
      return { code: BAG_DRAW_ERROR.BAG_INVALID, message: '格子编号无效' };
    }
  }

  const sold = await getSoldBoxNos(bagId);
  for (const boxNo of uniqueBoxNos) {
    if (sold.has(boxNo)) {
      return { code: BAG_DRAW_ERROR.BOX_SOLD, message: `格子 ${boxNo} 已售出` };
    }
  }

  for (const boxNo of uniqueBoxNos) {
    const locked = await verifyUserBoxLock(bagId, boxNo, userId);
    if (!locked) {
      return {
        code: BAG_DRAW_ERROR.BOX_NOT_LOCKED,
        message: `格子 ${boxNo} 未锁定或锁已过期`,
      };
    }
  }

  const batchId = newId('bagdraw');
  const cost = uniqueBoxNos.length;

  try {
    const result = await withTransaction(async (client) => {
      await ensureWeekReset(client, userId);

      const userRes = await client.query(
        `SELECT draw_chances, total_score, week_max_lucky, week_lucky_at
         FROM app_user WHERE id = $1 FOR UPDATE`,
        [userId],
      );
      if (!userRes.rowCount) {
        return { code: 401, message: '未授权' };
      }

      const user = userRes.rows[0];
      if (Number(user.draw_chances) < cost) {
        return { code: BAG_DRAW_ERROR.NOT_ENOUGH_CHANCES, message: '抽赏次数不足' };
      }

      const balance = await grantDrawChances(client, userId, -cost, 'bag_draw');
      const items = await loadBagItems(client, bagId);
      const prizes: IBagDrawPrize[] = [];
      let weekMaxLucky = Number(user.week_max_lucky);
      let weekLuckyAt: Date | null = user.week_lucky_at
        ? new Date(user.week_lucky_at)
        : null;
      let totalScore = Number(user.total_score);

      for (const boxNo of uniqueBoxNos) {
        const picked = pickBagItemForBox(bagId, boxNo, items);
        const mappedRarity = mapBagRarity(picked.rarity);
        const luckyGained = luckyFromBagItem(picked);
        const scoreGained = Math.max(
          Number(picked.prize_score) || 0,
          luckyGained,
        );

        const collection = await applyBagCollection(
          client,
          userId,
          picked.id,
          mappedRarity,
        );

        totalScore = await grantScore(
          client,
          userId,
          scoreGained,
          'bag_draw',
          `${bagId}:${boxNo}`,
        );

        if (luckyGained > weekMaxLucky) {
          weekMaxLucky = luckyGained;
          weekLuckyAt = new Date();
        } else if (
          luckyGained === weekMaxLucky &&
          (!weekLuckyAt || new Date() < weekLuckyAt)
        ) {
          weekLuckyAt = new Date();
        }

        const indexId = newId('gbi');
        const cabinetId = newId('cabinet');

        await client.query(
          `INSERT INTO grab_bag_index
           (id, grab_bag_id, grab_bag_item_id, user_id, order_id, index_no, status)
           VALUES ($1,$2,$3,$4,NULL,$5,1)`,
          [indexId, bagId, picked.id, userId, boxNo],
        );

        await client.query(
          `INSERT INTO user_prize_cabinet
           (id, user_id, grab_bag_id, grab_bag_item_id, order_id, grab_bag_index_id,
            index_no, prize_name, prize_photo, prize_score, rarity, ownership,
            is_shareable, prize_status, prize_category, unique_category)
           VALUES ($1,$2,$3,$4,NULL,$5,$6,$7,$8,$9,$10,'',FALSE,1,'','')`,
          [
            cabinetId,
            userId,
            bagId,
            picked.id,
            indexId,
            boxNo,
            picked.item_name,
            picked.item_cover || '',
            scoreGained,
            toStr(picked.rarity) || 'normal',
          ],
        );

        await client.query(
          `INSERT INTO gacha_draw_log
           (user_id, pool_id, item_id, rarity, rarity_score, score_gained,
            is_duplicate, fragments, draw_type, batch_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'bag_box',$9)`,
          [
            userId,
            bagId,
            picked.id,
            mappedRarity,
            luckyGained,
            scoreGained,
            collection.isDuplicate,
            collection.fragments,
            batchId,
          ],
        );

        await client.query(
          `UPDATE bag_item SET send_count = send_count + 1,
           surplus_count = GREATEST(surplus_count - 1, 0), updated_at = NOW()
           WHERE id = $1`,
          [picked.id],
        );

        const itemIdx = items.findIndex((i) => i.id === picked.id);
        if (itemIdx >= 0) {
          items[itemIdx]!.surplus_count = Math.max(
            0,
            Number(items[itemIdx]!.surplus_count) - 1,
          );
        }

        prizes.push({
          boxNo,
          prizeName: toStr(picked.item_name),
          prizeImage: toStr(picked.item_cover) || undefined,
          grade: toStr(picked.level_name) || undefined,
          itemId: picked.id,
          rarity: mappedRarity,
          isNew: collection.isNew,
          isDuplicate: collection.isDuplicate,
          fragmentsGained: collection.fragments,
          scoreGained,
          luckyGained,
        });
      }

      await client.query(
        `UPDATE app_user
         SET total_draws = total_draws + $2,
             week_draws = week_draws + $2,
             week_max_lucky = $3,
             week_lucky_at = $4,
             reward_total = reward_total + $2,
             updated_at = NOW()
         WHERE id = $1`,
        [userId, cost, weekMaxLucky, weekLuckyAt],
      );

      return {
        batchId,
        bagId,
        boxNos: uniqueBoxNos,
        balance,
        prizes,
        totalScore,
      } satisfies IBagDrawResult;
    });

    if ('code' in result && result.code) {
      return result;
    }

    await markBoxesSold(bagId, uniqueBoxNos);
    return result as IBagDrawResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : '开赏失败';
    return { code: 400, message };
  }
}
