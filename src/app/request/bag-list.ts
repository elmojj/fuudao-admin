import { ParamsType } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { postRequest } from '../host-app';
import { APIResponse, DefaultListAPIResponse } from './api/api-response';

export interface GetBagListType {
  id: string;
  categoryId: string;
  packageName: string;
  cover: string;
  sharePhoto: string;
  price: string;
  startTime: string;
  endTime: string;
  totalPackage: string;
  everyPrizeItemId: string;
  hasEveryPrize: boolean;
  everyPrizeCount: string;
  hasLastPrize: boolean;
  lastPrizeItemId: string;
  limitBuy: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  categoryName: string;
  everyPrizeItem: {
    id: string;
    itemName: string;
    itemCover: string;
  };
  lastPrizeItem: {
    id: string;
    itemName: string;
    itemCover: string;
  };
}
export default async function getBagList(
  params: ParamsType & {
    pageSize?: number | undefined;
    current?: number | undefined;
    keyword?: string | undefined;
  },
): Promise<DefaultListAPIResponse<GetBagListType>> {
  const res: any = await postRequest({
    code: 'features/v1/bag/list',
    params: {
      page: params.current,
      pageSize: params.pageSize,
      packageName: params.packageName,
      categoryId: params.categoryId,
      bagId: params.id,
      status: params.status,
    },
  });

  if (res.code === 200) {
    return {
      status: 'Success',
      total: Number(res.data.total),
      list: res.data.lists,
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
  id?: string;
  categoryId: string;
  packageName: string;
  cover?: string;
  sharePhoto?: string;
  price?: string;
  startTime?: string;
  endTime?: string;
  totalPackage?: string;
  everyPrizeItemId?: string;
  hasEveryPrize: boolean;
  everyPrizeCount?: string;
  hasLastPrize: boolean;
  lastPrizeItemId?: string;
  limitBuy?: string;
  status: boolean;
}
export async function createAndEditBag(
  params: EditorBagFormType,
): Promise<APIResponse> {
  const res: any = await postRequest({
    code: 'features/v1/bag/createOrUpdate',
    params: {
      ...params,
      price: params.price?.toString(),
      startTime: dayjs(params.startTime).format('YYYY-MM-DD HH:mm:ss'),
      endTime: dayjs(params.endTime).format('YYYY-MM-DD HH:mm:ss'),
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
