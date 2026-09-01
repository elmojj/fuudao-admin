import { ParamsType } from '@ant-design/pro-components';
import { postRequest } from '../host-app';
import { APIResponse, DefaultListAPIResponse } from './api/api-response';

export interface GetUserListType {
  id: string;
  phoneNumber: string;
  nickname: string;
  avatar: string;
  appid: string;
  openid: string;
  unionid: string;
  sessionKey: string;
  accessToken: string;
  updatedAt: string;
  createdAt: string;
  userGroupName: string;
  stats: {
    buyAmountTotal: number;
    buyTotal: number;
    rewardTotal: number;
  };
  address: {
    address: string;
    area: string;
    city: string;
    consignee: string;
    createdAt: string;
    id: string;
    isDefault: number;
    phoneNumber: string;
    province: string;
    status: number;
    updatedAt: string;
    userId: string;
    zipcode: string;
  };
  tags: {
    cate: string;
    cateVal: string;
    tagName: string;
  }[];
  drawChances?: number;
  totalDraws?: number;
  totalScore?: number;
  seasonScore?: number;
  honorScore?: number;
  weekMaxLucky?: number;
  pitySrCount?: number;
  pitySsrCount?: number;
  fragments?: number;
  equippedTitle?: string;
  inviteCode?: string;
  collectionCount?: number;
  collectionTotal?: number;
  titles?: { id: string; name: string }[];
}
export default async function getUserList(
  params: ParamsType & {
    pageSize?: number | undefined;
    current?: number | undefined;
    keyword?: string | undefined;
  },
): Promise<DefaultListAPIResponse<GetUserListType>> {
  const res: any = await postRequest({
    code: 'features/v1/user/list',
    params: {
      ...params,
      page: params.current,
      pageSize: params.pageSize,
    },
  });

  if (res.code === 200) {
    return {
      status: 'Success',
      total: Number(res.data.total),
      list: res.data.users,
    };
  }

  return {
    status: 'Fail',
    total: 0,
    list: [],
    errorMessage: res.message,
  };
}

export interface GetUserInfo extends APIResponse {
  value?: GetUserListType;
}

export async function getUserById(id: string): Promise<GetUserInfo> {
  const res: any = await postRequest({
    code: 'features/v1/user/get',
    params: {
      id,
    },
  });

  if (res.code === 200) {
    return {
      status: 'Success',
      value: res.data.user,
    };
  }

  return {
    status: 'Fail',
    errorMessage: res.message,
  };
}
export async function editCategory(params: {
  id?: string;
  categoryName?: string;
}): Promise<APIResponse> {
  const res: any = await postRequest({
    code: 'features/v1/bag_category/createOrUpdate',
    params: {
      id: params.id,
      categoryName: params.categoryName,
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
