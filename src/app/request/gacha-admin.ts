import { ParamsType } from '@ant-design/pro-components';
import { postRequest } from '../host-app';
import { APIResponse, DefaultListAPIResponse } from './api/api-response';

function toList<T>(res: any): DefaultListAPIResponse<T> {
  if (res.code === 200) {
    return {
      status: 'Success',
      total: Number(res.data.total),
      list: res.data.lists || [],
    };
  }
  return { status: 'Fail', total: 0, list: [], errorMessage: res.message };
}

export type GachaPoolItem = {
  poolId: string;
  name: string;
  description: string;
  coverImage: string;
  sort: number;
  status: number;
  itemCount: number;
  createdAt: string;
};

export type GachaItemRecord = {
  itemId: string;
  name: string;
  rarity: string;
  rarityScore: number;
  scoreValue: number;
  series: string;
  seriesTotal: number;
  image: string;
  animation: string;
  dropWeight: number;
  dropRate?: number;
  poolId: string;
  isLimited: boolean;
  limitedEnd: string;
  status: number;
};

export type GachaDrawLogRecord = {
  id: string;
  userId: string;
  nickname: string;
  poolId: string;
  itemId: string;
  itemName: string;
  rarity: string;
  drawType: string;
  scoreGained: number;
  isDuplicate: boolean;
  createdAt: string;
};

export async function getGachaPoolList(
  params: ParamsType & { current?: number; pageSize?: number },
) {
  return toList<GachaPoolItem>(
    await postRequest({
      code: 'features/v1/gacha_pool/list',
      params: { page: params.current, pageSize: params.pageSize },
    }),
  );
}

export async function saveGachaPool(params: Partial<GachaPoolItem>) {
  const res: any = await postRequest({
    code: 'features/v1/gacha_pool/createOrUpdate',
    params,
  });
  return res.code === 200
    ? { status: 'Success' as const }
    : { status: 'Fail' as const, errorMessage: res.message };
}

export async function getGachaItemList(
  params: ParamsType & {
    current?: number;
    pageSize?: number;
    poolId?: string;
    rarity?: string;
    name?: string;
  },
) {
  return toList<GachaItemRecord>(
    await postRequest({
      code: 'features/v1/gacha_item/list',
      params: {
        page: params.current,
        pageSize: params.pageSize,
        poolId: params.poolId,
        rarity: params.rarity,
        name: params.name,
      },
    }),
  );
}

export async function saveGachaItem(params: Partial<GachaItemRecord>) {
  const res: any = await postRequest({
    code: 'features/v1/gacha_item/createOrUpdate',
    params,
  });
  return res.code === 200
    ? { status: 'Success' as const }
    : { status: 'Fail' as const, errorMessage: res.message };
}

export async function deleteGachaItem(itemId: string) {
  const res: any = await postRequest({
    code: 'features/v1/gacha_item/delete',
    params: { itemId },
  });
  return res.code === 200
    ? { status: 'Success' as const }
    : { status: 'Fail' as const, errorMessage: res.message };
}

export async function getGachaDrawLogList(
  params: ParamsType & {
    current?: number;
    pageSize?: number;
    userId?: string;
    poolId?: string;
    drawType?: string;
    keyword?: string;
  },
) {
  return toList<GachaDrawLogRecord>(
    await postRequest({
      code: 'features/v1/gacha_draw_log/list',
      params: {
        page: params.current,
        pageSize: params.pageSize,
        ...params,
      },
    }),
  );
}

export async function getGachaChanceLogList(params: ParamsType & { userId?: string }) {
  return toList(
    await postRequest({
      code: 'features/v1/gacha_chance_log/list',
      params: { page: params.current, pageSize: params.pageSize, userId: params.userId },
    }),
  );
}

export async function getGachaScoreLogList(params: ParamsType & { userId?: string }) {
  return toList(
    await postRequest({
      code: 'features/v1/gacha_score_log/list',
      params: { page: params.current, pageSize: params.pageSize, userId: params.userId },
    }),
  );
}

export async function getGachaRankSnapshotList(params: ParamsType) {
  return toList(
    await postRequest({
      code: 'features/v1/gacha_rank_snapshot/list',
      params: { page: params.current, pageSize: params.pageSize, ...params },
    }),
  );
}

export async function grantGachaChance(userId: string, delta: number, source?: string) {
  const res: any = await postRequest({
    code: 'features/v1/gacha_chance/grant',
    params: { userId, delta, source },
  });
  return res.code === 200
    ? { status: 'Success' as const, balance: res.data.balance }
    : { status: 'Fail' as const, errorMessage: res.message || res.data?.error };
}

export async function getUserCollectionList(
  userId: string,
  params: ParamsType,
) {
  return toList(
    await postRequest({
      code: 'features/v1/user/collection/list',
      params: { userId, page: params.current, pageSize: params.pageSize },
    }),
  );
}

export async function getBagBoxStateAdmin(bagId: string) {
  const res: any = await postRequest({
    code: 'features/v1/bag/box/state',
    params: { bagId },
  });
  if (res.code === 200) return { status: 'Success' as const, data: res.data };
  return { status: 'Fail' as const, errorMessage: res.message || res.data?.error };
}

export async function getDashboardStats(): Promise<
  APIResponse & { data?: Record<string, unknown> }
> {
  const res: any = await postRequest({
    code: 'features/v1/dashboard/stats',
    params: {},
  });
  if (res.code === 200) return { status: 'Success', data: res.data };
  return { status: 'Fail', errorMessage: res.message };
}
