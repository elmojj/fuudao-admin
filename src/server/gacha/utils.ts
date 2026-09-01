import type { GachaItemRow, Rarity } from './types';

export function getWeekKey(date = new Date()): string {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}W${String(weekNo).padStart(2, '0')}`;
}

export function getSeasonKey(date = new Date()): string {
  const week = getWeekKey(date);
  const year = Number(week.slice(0, 4));
  const weekNo = Number(week.slice(5));
  const seasonIndex = Math.floor((weekNo - 1) / 4) + 1;
  return `season_${year}_${seasonIndex}`;
}

export function getSeasonWeek(date = new Date()): number {
  const weekNo = Number(getWeekKey(date).slice(5));
  return ((weekNo - 1) % 4) + 1;
}

export function getNextMondayReset(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMonday);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function todayDateStr(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function randomInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function mapGachaItem(row: GachaItemRow, dropRate?: number) {
  return {
    itemId: row.item_id,
    name: row.name,
    rarity: row.rarity as Rarity,
    rarityScore: row.rarity_score,
    scoreValue: row.score_value,
    series: row.series,
    seriesTotal: row.series_total,
    image: row.image || '',
    animation: row.animation as 'normal' | 'gold' | 'rainbow',
    ...(dropRate !== undefined ? { dropRate } : {}),
  };
}

export const TITLE_DEFS: Record<
  string,
  { name: string; condition: string }
> = {
  newcomer: { name: '初来乍到', condition: 'register' },
  draw_10: { name: '小试牛刀', condition: 'draw_10' },
  rank_active_1: { name: '肝帝', condition: 'rank_active_1' },
  rank_lucky_1: { name: '欧皇', condition: 'rank_lucky_1' },
  rank_score_10: { name: '收藏家', condition: 'rank_score_10' },
  full_album: { name: '全图鉴大师', condition: 'full_album' },
};
