import { mallPaginate } from '../../mall-response';
import {
  executeDraw,
  getDrawLogs,
  getGachaPool,
  getPityState,
  listGachaPools,
} from '../../gacha/draw';
import { getDrawChanceBalance, getDrawChanceLogs } from '../../gacha/chance';
import { getAlbumItems, getAlbumSeries, getAlbumSummary } from '../../gacha/album';
import { getScoreBalance, getScoreLogs } from '../../gacha/score';
import { claimTask, getTaskList } from '../../gacha/task';
import { getRankList } from '../../gacha/rank';
import { bindInvite, getInviteInfo } from '../../gacha/share';
import { equipTitle } from '../../gacha/profile';
import type { RankType, TaskType } from '../../gacha/types';

export async function handleGachaPool(params: Record<string, string>) {
  const poolId = params.poolId || 'default';
  const pool = await getGachaPool(poolId);
  if (!pool) return { error: '赏池不存在', code: 40002 };
  return pool;
}

export async function handleGachaPools() {
  return listGachaPools();
}

export async function handleGachaPity(userId: string, params: Record<string, string>) {
  void params;
  return getPityState(userId);
}

export async function handleGachaDraw(
  userId: string,
  body: Record<string, unknown>,
) {
  const poolId = String(body.poolId || 'default');
  const count = Number(body.count) === 10 ? 10 : 1;
  return executeDraw(userId, poolId, count as 1 | 10);
}

export async function handleGachaLogs(
  userId: string,
  params: Record<string, string>,
) {
  const { limit, offset } = mallPaginate(params.page, params.size);
  return getDrawLogs(userId, limit, offset);
}

export async function handleDrawChanceBalance(userId: string) {
  return getDrawChanceBalance(userId);
}

export async function handleDrawChanceLogs(
  userId: string,
  params: Record<string, string>,
) {
  const { limit, offset } = mallPaginate(params.page, params.size);
  return getDrawChanceLogs(userId, limit, offset);
}

export async function handleTaskList(userId: string) {
  return getTaskList(userId);
}

export async function handleTaskClaim(
  userId: string,
  body: Record<string, unknown>,
) {
  const type = String(body.type || '') as TaskType;
  return claimTask(userId, type);
}

export async function handleAlbumSummary(userId: string) {
  return getAlbumSummary(userId);
}

export async function handleAlbumSeries(
  userId: string,
  params: Record<string, string>,
) {
  const series = params.series || '星际漫游';
  return getAlbumSeries(userId, series);
}

export async function handleAlbumItems(
  userId: string,
  params: Record<string, string>,
) {
  const { limit, offset } = mallPaginate(params.page, params.size, 50);
  return getAlbumItems(userId, limit, offset);
}

export async function handleScoreBalance(userId: string) {
  return getScoreBalance(userId);
}

export async function handleScoreLogs(
  userId: string,
  params: Record<string, string>,
) {
  const { limit, offset } = mallPaginate(params.page, params.size);
  return getScoreLogs(userId, limit, offset);
}

export async function handleRankList(
  userId: string | null,
  params: Record<string, string>,
) {
  const type = (params.type || 'active') as RankType;
  const { current, size } = mallPaginate(params.page, params.size, 50);
  if (!['active', 'lucky', 'score'].includes(type)) {
    return { error: '榜单类型无效' };
  }
  return getRankList(type, current, size, userId || undefined);
}

export async function handleShareInvite(userId: string) {
  return getInviteInfo(userId);
}

export async function handleShareBind(
  userId: string,
  body: Record<string, unknown>,
) {
  return bindInvite(userId, String(body.inviteCode || ''));
}

export async function handleUserTitle(
  userId: string,
  body: Record<string, unknown>,
) {
  return equipTitle(userId, String(body.titleId || ''));
}
