import { ParamsType } from '@ant-design/pro-components';
import { postRequest } from '../host-app';
import { APIResponse, DefaultListAPIResponse } from './api/api-response';

export const orderStatusOptions = [
  { value: 1, label: '待支付' },
  { value: 2, label: '已支付' },
  { value: 3, label: '超时待退款' },
  { value: 4, label: '超时取消' },
  { value: 5, label: '申请发货' },
  { value: 6, label: '申请发货待付款' },
  { value: 7, label: '已发货' },
  { value: 8, label: '已退款' },
  { value: 9, label: '已完成' },
];

export const logisticStatusOptions = [
  { value: 2, label: '申请发货' },
  { value: 3, label: '已发货' },
  { value: 4, label: '已签收' },
];

export function getOrderStatusText(type: number | string) {
  const statusInfo = orderStatusOptions.find((i) => i.value === type);
  return statusInfo?.label ?? type.toString();
}

export function getLogisticsStatusText(type: number | string) {
  const statusInfo = logisticStatusOptions.find((i) => i.value === type);
  return statusInfo?.label ?? type.toString();
}

export interface GetOrderListType {
  id: string;
  logisticsId: string;
  grabBagId: string;
  buyUserId: string;
  lotteryResult: {
    grabBagItemId: string;
    grabBagIndexId: string;
    index: number;
    itemName: string;
    itemCover: string;
  }[];
  grabBagIndex: string[];
  transactionId: string;
  totalCount: string;
  totalPrice: string;
  price: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    nickname: string;
    avatar: string;
    tags: string[];
    userGroup: string;
  };
  bagInfo: {
    id: string;
    packageName: string;
    cover: string;
    cost: string;
  };
}
export default async function getOrderList(
  params: ParamsType & {
    pageSize?: number | undefined;
    current?: number | undefined;
    keyword?: string | undefined;
  },
): Promise<DefaultListAPIResponse<GetOrderListType>> {
  // //1 待支付 2 已支付 3超时待退款 4 超时取消 5 申请发货 6 申请发货待付款 7已发货  8已退款
  const res: any = await postRequest({
    code: 'features/v1/order/list',
    params: {
      page: params.current,
      pageSize: params.pageSize,
      orderId: params.id ? params.id.split(',') : undefined,
      grabBagId: params.grabBagId === '' ? undefined : params.grabBagId,
      buyUserId: params.buyUserId === '' ? undefined : params.buyUserId,
      buyTimeStart: params.buyTimeStart,
      buyTimeEnd: params.buyTimeEnd,
      status: params.status === '2,5,7,9' ? undefined : params.status,
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

export async function edit(params: {
  id?: string;
  Name?: string;
}): Promise<APIResponse> {
  const res: any = await postRequest({
    code: 'features/v1/order/createOrUpdate',
    params: {
      id: params.id,
      Name: params.Name,
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

export async function logisticsOrder(orderId: string[]): Promise<APIResponse> {
  const res: any = await postRequest({
    code: 'features/v1/order/batch_create_logistics',
    params: {
      orderId,
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
