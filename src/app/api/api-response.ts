/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

export type ResponseType = 'Success' | 'Fail';

export interface APIResponse {
  status: ResponseType;
  errorMessage?: string;
}

/** 用于获取列表的API返回值 */
export interface DefaultListAPIResponse<T> extends APIResponse {
  total: number;
  list: T[];
  count?: { [key: string]: number };
}

/** 后端默认接口返回格式 */
export interface DefaultBackendResponse<T = unknown> {
  json_ok?: boolean; // 是否成功
  json_msg?: string; // 错误原因
  values?: T; // 返回值
}

export interface DefaultBackendValues<T> {
  count?: string; // 记录个数
  records?: T[]; // 记录内容
}

export interface HasTotalCountBackendValues<T, K> {
  records?: T[]; // 记录内容
  total_count?: string; // 记录个数
  count: K;
}

/** 后端默认列表接口返回格式 */
export interface DefaultListBackendResponse<T> extends DefaultBackendResponse {
  values?: DefaultBackendValues<T>;
}

export interface HasTotalCountBackendResponse<T, K>
  extends DefaultBackendResponse {
  values?: HasTotalCountBackendValues<T, K>;
}

/** 用于只需要获取成功还是失败的高阶函数处理器 */
export function withApiResponseHandler<T>(
  apiFunction: (params: T) => Promise<APIResponse>,
) {
  return async function handler(params: T): Promise<APIResponse> {
    const data = (await apiFunction(params)) as DefaultBackendResponse;
    if (data?.json_ok) {
      return {
        status: 'Success',
      };
    }

    return {
      status: 'Fail',
      errorMessage: data?.json_msg,
    };
  };
}

export function isDefaultListAPIResponse<T>(
  response: any,
): response is DefaultListAPIResponse<T> {
  return 'list' in response;
}
