/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { PageParams } from './api-request';
import { APIResponse } from './api-response';

export interface FetchAllAPIResponse<T> extends APIResponse {
  total?: number;
  list?: T[];
}

/**
 * 用于对分页列表一次性获取所有数据
 * @param apiFunction 请求接口函数
 * @param formData 请求参数
 * @param pageSize 分页大小，默认为20
 * @returns 返回所有数据
 */
export const fetchAllRequest = async <T, FormData>(
  apiFunction: (
    params: PageParams,
    formData?: FormData,
  ) => Promise<FetchAllAPIResponse<T>>,
  formData?: FormData,
  pageSize: number = 20,
): Promise<T[]> => {
  try {
    const initialResponse = await apiFunction(
      { current: 1, pageSize },
      formData,
    );
    const total = initialResponse?.total || 0;
    if (total <= pageSize) {
      return initialResponse?.list || [];
    }
    const totalPages = Math.ceil(total / pageSize) - 1;
    const allPromises = Array.from({ length: totalPages }, (_, index) =>
      apiFunction({ current: index + 2, pageSize }, formData).then(
        (res) => res.list || [],
      ),
    );
    const allResults = await Promise.all(allPromises);
    return allResults.concat(initialResponse?.list ?? []).flat();
  } catch (error) {
    console.error('Fetch data error:', error);
    return [];
  }
};
