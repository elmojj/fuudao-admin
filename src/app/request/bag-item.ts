import { postRequest } from '../host-app';
import { APIResponse } from './api/api-response';

export interface EditorBagItemFormType {
  id: string;
  grabBagId: string;
  itemName: string;
  levelId: number;
  itemCover: string;
  totalCount: number;
  sendCount: number;
  surplusCount: number;
  referPrice: string;
  probRate: string;
  status: number;
  stockId: number;
  extJson: string;
  sort: number;
}

export async function createAndEditBagItem(
  params: EditorBagItemFormType,
): Promise<APIResponse> {
  const res: any = await postRequest({
    code: 'features/v1/item/createOrUpdate',
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

export async function createAndEditBagItemBatch(
  params: EditorBagItemFormType[],
): Promise<APIResponse> {
  const res: any = await postRequest({
    code: 'features/v1/item/batchCreateOrUpdate',
    params: {
      data: params,
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

export async function deleteBagItemBatch(id: string) {
  const res: any = await postRequest({
    code: 'features/v1/item/delete',
    params: {
      id,
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
