import { ParamsType } from '@ant-design/pro-components';
import { postRequest } from '../host-app';
import { APIResponse, DefaultListAPIResponse } from './api/api-response';

export interface GetBagCategoryListType {
  id: 'string';
  categoryName: 'string';
  createdAt: 'string';
  updatedAt: 'string';
}
export default async function getBagCategoryList(
  params: ParamsType & {
    pageSize?: number | undefined;
    current?: number | undefined;
    keyword?: string | undefined;
  },
): Promise<DefaultListAPIResponse<GetBagCategoryListType>> {
  const res: any = await postRequest({
    code: 'features/v1/bag_category/list',
    params: {
      page: params.current,
      pageSize: params.pageSize,
      categoryName: params.categoryName,
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
