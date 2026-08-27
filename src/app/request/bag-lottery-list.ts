import { ParamsType } from '@ant-design/pro-components';
import { postRequest } from '../host-app';
import { APIResponse, DefaultListAPIResponse } from './api/api-response';

export interface GetLotteryListType {
  id: string;
  grabBagId: string;
  itemName: string;
  levelId: string;
  itemCover: string;
  totalCount: string;
  sendCount: string;
  surplusCount: string;
  referPrice: string;
  stockPrice: string;
  probRate: string;
  status: number;
  bagInfo: {
    packageName: string;
    cover: string;
  };
  levelName: string;
  stockId: string;
  extJson: string;
  sort: string;
}

export type NORMAL = 1;
export type EVERY = 2;
export type LAST = 3;
export enum LevelType {
  NORMAL = '普通赏',
  EVERY = '保底赏',
  LAST = '终极赏',
}

export const getLevelTypeName = (value: NORMAL | EVERY | LAST) => {
  switch (value) {
    case 3:
      return '终极赏';
    case 2:
      return '保底赏';
    case 1:
    default:
      return '普通赏';
  }
};
export const levelOptions = [1, 2, 3].map((item) => ({
  value: item,
  label: getLevelTypeName(item as NORMAL | EVERY | LAST),
}));

export interface GetLotteryLevelListType {
  id: string;
  grabBagId: string;
  levelId: string;
  status: number;
  itemName: string;
}
export default async function getLotteryByBagList(
  params: ParamsType & {
    pageSize?: number | undefined;
    current?: number | undefined;
    keyword?: string | undefined;
  },
): Promise<DefaultListAPIResponse<GetLotteryListType>> {
  const res: any = await postRequest({
    code: 'features/v1/item/list',
    params: {
      page: params.current,
      pageSize: params.pageSize,
      grabBagId: params.id.toString(),
      levelId: params.levelId,
      itemName: params.itemName,
      status: params.status,
    },
  });

  if (res.code === 200) {
    return {
      status: 'Success',
      total: Number(res.data.total),
      list: res.data.data ?? [],
    };
  }

  return {
    status: 'Fail',
    total: 0,
    list: [],
    errorMessage: res.message,
  };
}

export interface EditorBagFormType {
  productName: string;
  productCode: string;
  productPhoto: string;
  price: string;
  stockpileCount: string;
  status: Number;
}
export async function createAndEditLottery(
  params: EditorBagFormType,
): Promise<APIResponse> {
  const res: any = await postRequest({
    code: 'v1/stockpile/createOrUpdate',
    params: {
      ...params,
      status: params.status ? 1 : 2,
    },
  });

  if (res.code === 200) {
    return {
      status: 'Success',
    };
  }

  return {
    status: 'Fail',
    errorMessage: res.message,
  };
}

export const getLotteryLevelList = async (
  params: ParamsType & {
    pageSize?: number | undefined;
    current?: number | undefined;
    keyword?: string | undefined;
  },
): Promise<DefaultListAPIResponse<GetLotteryLevelListType>> => {
  const res: any = await postRequest({
    code: 'features/v1/item_level/list',
    params: {
      ...params,
    },
  });

  if (res.code === 200) {
    return {
      status: 'Success',
      total: Number(res.data.total),
      list: res.data.itemLevels,
    };
  }

  return {
    status: 'Fail',
    total: 0,
    list: [],
    errorMessage: res.message,
  };
};

export async function editLevel(params: {
  id?: string;
  levelName?: string;
  levelType?: NORMAL | EVERY | LAST;
  status?: Number;
}): Promise<APIResponse> {
  const res: any = await postRequest({
    code: 'features/v1/item_level/createOrUpdate',
    params: {
      ...params,
      status: params.status ? 1 : 0,
    },
  });

  if (res.code === 200) {
    return {
      status: 'Success',
    };
  }

  return {
    status: 'Fail',
    errorMessage: res.message,
  };
}

export async function deleteLotteryLevel(params: {
  id: string;
}): Promise<APIResponse> {
  const res: any = await postRequest({
    code: 'features/v1/item_level/delete',
    params,
  });

  if (res.code === 200) {
    return {
      status: 'Success',
    };
  }

  return {
    status: 'Fail',
    errorMessage: res.message,
  };
}
