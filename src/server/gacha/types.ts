export type Rarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';
export type RankType = 'active' | 'lucky' | 'score';
export type TaskType =
  | 'login'
  | 'share'
  | 'invite'
  | 'checkin'
  | 'ad'
  | 'series_complete';

export type GachaItemRow = {
  item_id: string;
  name: string;
  rarity: Rarity;
  rarity_score: number;
  score_value: number;
  series: string;
  series_total: number;
  image: string;
  animation: string;
  drop_weight: string | number;
  pool_id: string;
  is_limited: boolean;
  limited_end: Date | null;
};

export const RARITY_RANK: Record<Rarity, number> = {
  N: 1,
  R: 2,
  SR: 3,
  SSR: 4,
  UR: 5,
};

export const FRAGMENTS_BY_RARITY: Record<Rarity, number> = {
  N: 1,
  R: 3,
  SR: 10,
  SSR: 30,
  UR: 100,
};

export const GACHA_SR_PITY = Number(process.env.GACHA_SR_PITY || 30);
export const GACHA_SSR_PITY = Number(process.env.GACHA_SSR_PITY || 100);
