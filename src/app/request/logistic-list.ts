import { ParamsType } from '@ant-design/pro-components';
import { downloadRequest, postRequest } from '../host-app';
import { APIResponse, DefaultListAPIResponse } from './api/api-response';

export interface GetLogisticListType {
  id: string;
  indexIds: string;
  orderIds: string;
  userId: string;
  trackingNumber: string;
  trackingToken: string;
  deliveryId: string;
  address: string;
  area: string;
  city: string;
  province: string;
  consignee: string;
  zipcode: string;
  phoneNumber: string;
  status: number;
  price: string;
  transactionId: string;
  createdAt: string;
  updatedAt: string;
  indexInfo: {
    id: string;
    grabBagId: string;
    userId: string;
    grabBagItemId: string;
    status: number;
    itemName: string;
    itemCover: string;
    levelId: string;
    levelName: string;
    index: number;
    grabBagName: string;
  }[];
  userInfo: {
    nickname: string;
    avatar: string;
  };
  deliveryName: string;
}

export interface EditorLogisticFormType {
  id: string | string[];
  status: number;
  trackingNumber: string;
  deliveryId: string;
}

export default async function getLogisticList(
  params: ParamsType & {
    pageSize?: number | undefined;
    current?: number | undefined;
    keyword?: string | undefined;
  },
): Promise<DefaultListAPIResponse<GetLogisticListType>> {
  const res: any = await postRequest({
    code: 'features/v1/logistics/list',
    params: {
      page: params.current,
      pageSize: params.pageSize,
      userId: params.userId,
      deliveryId: params.deliveryId,
      status: params.status,
      trackingNumber: params.trackingNumber,
      startTime: params.startTime,
      endTime: params.endTime,
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

export async function createAndEditLogistic(
  params: EditorLogisticFormType,
): Promise<APIResponse> {
  const res: any = await postRequest({
    code: 'features/v1/logistics/update',
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

export async function logisticSendBatch(
  params: EditorLogisticFormType,
): Promise<APIResponse> {
  const res: any = await postRequest({
    code: 'features/v1/logistics/batch_delivery',
    params: {
      ids: params.id,
      trackingNumber: params.trackingNumber,
      deliveryId: params.deliveryId,
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

export async function logisticSignBatch(ids: string[]): Promise<APIResponse> {
  const res: any = await postRequest({
    code: 'features/v1/logistics/batch_sign',
    params: {
      ids,
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

export async function exportLogisticsData(params: {
  userId?: number;
  status?: number[];
  startTime: string;
  endTime: string;
}) {
  await downloadRequest({
    code: 'features/v1/logistics/export',
    params: params ?? {
      userId: 0,
      deliveryId: '',
      status: [2],
      trackingNumber: '',
      startTime: '',
      endTime: '',
      orderId: 0,
      itemName: '',
      updateStartTime: '',
      updateEndTime: '',
    },
  });
}

export interface DeliveryType {
  deliveryId: string;
  deliveryName: string;
}

export async function GetDeliveryList(): Promise<
  DefaultListAPIResponse<DeliveryType>
> {
  const res: any = await postRequest({
    code: 'features/v1/logistics/delivery',
    params: {},
  });

  if (res.code === 200) {
    return {
      total: res.data.lists.length,
      status: 'Success',
      list: res.data.lists,
    };
  }

  return {
    status: 'Fail',
    errorMessage: res.message,
    list: [],
    total: 0,
  };
}
