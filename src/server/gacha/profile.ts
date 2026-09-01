import type { PoolClient } from 'pg';
import { query } from '../db';
import { formatTime, toStr } from '../response';
import { getCollectionCounts } from './album';
import { randomInviteCode, TITLE_DEFS } from './utils';

type TitleEntry = { id: string; name: string; unlockedAt: string };

export async function ensureInviteCode(userId: string): Promise<string> {
  const res = await query(
    `SELECT invite_code FROM app_user WHERE id = $1`,
    [userId],
  );
  if (res.rows[0]?.invite_code) {
    return String(res.rows[0].invite_code);
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomInviteCode();
    const exists = await query(
      `SELECT 1 FROM app_user WHERE invite_code = $1`,
      [code],
    );
    if (exists.rowCount) continue;

    await query(
      `UPDATE app_user SET invite_code = $2, updated_at = NOW() WHERE id = $1`,
      [userId, code],
    );
    await unlockTitle(null, userId, 'newcomer');
    return code;
  }
  return randomInviteCode();
}

export async function unlockTitle(
  client: PoolClient | null,
  userId: string,
  titleId: string,
) {
  const def = TITLE_DEFS[titleId];
  if (!def) return;

  const q = client
    ? (text: string, params: unknown[]) => client.query(text, params)
    : query;

  const res = await q(
    `SELECT unlocked_titles FROM app_user WHERE id = $1`,
    [userId],
  );
  const titles = (res.rows[0]?.unlocked_titles || []) as TitleEntry[];
  if (titles.some((t) => t.id === titleId)) return;

  const entry: TitleEntry = {
    id: titleId,
    name: def.name,
    unlockedAt: new Date().toISOString(),
  };
  titles.push(entry);

  await q(
    `UPDATE app_user
     SET unlocked_titles = $2::jsonb,
         equipped_title = COALESCE(equipped_title, $3),
         updated_at = NOW()
     WHERE id = $1`,
    [userId, JSON.stringify(titles), def.name],
  );
}

export async function equipTitle(userId: string, titleId: string) {
  const res = await query(
    `SELECT unlocked_titles FROM app_user WHERE id = $1`,
    [userId],
  );
  const titles = (res.rows[0]?.unlocked_titles || []) as TitleEntry[];
  const found = titles.find((t) => t.id === titleId);
  if (!found) return { error: '称号未解锁' };

  await query(
    `UPDATE app_user SET equipped_title = $2, updated_at = NOW() WHERE id = $1`,
    [userId, found.name],
  );
  return { titleId, title: found.name };
}

export async function getGachaProfileExtension(userId: string) {
  await ensureInviteCode(userId);

  const res = await query(`SELECT * FROM app_user WHERE id = $1`, [userId]);
  if (!res.rowCount) return null;
  const row = res.rows[0];
  const counts = await getCollectionCounts(userId);
  const titles = (row.unlocked_titles || []) as TitleEntry[];

  return {
    drawChances: Number(row.draw_chances ?? 0),
    totalDraws: Number(row.total_draws ?? 0),
    totalScore: Number(row.total_score ?? 0),
    weekMaxLucky: Number(row.week_max_lucky ?? 0),
    collectionCount: counts.collectionCount,
    collectionTotal: counts.collectionTotal,
    equippedTitle: row.equipped_title ? String(row.equipped_title) : undefined,
    titles,
    inviteCode: String(row.invite_code || ''),
    fragments: Number(row.fragments ?? 0),
  };
}

export async function buildExtendedProfile(userId: string) {
  const res = await query('SELECT * FROM app_user WHERE id = $1', [userId]);
  if (!res.rowCount) return null;
  const row = res.rows[0];
  const gacha = await getGachaProfileExtension(userId);

  return {
    id: toStr(row.id),
    nickname: toStr(row.nickname),
    avatar: toStr(row.avatar),
    phone: toStr(row.phone_number) || undefined,
    stats: {
      buyAmountTotal: Number(row.buy_amount_total || 0),
      buyTotal: Number(row.buy_total || 0),
      rewardTotal: Number(row.reward_total || 0),
    },
    createdAt: formatTime(row.created_at),
    ...gacha,
  };
}
