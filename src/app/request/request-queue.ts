/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { AxiosRequestConfig } from 'axios';

export interface RequestConfig extends AxiosRequestConfig {
  permissionCode?: string;
}

export interface RequestOption {
  option: RequestConfig;
  token?: string | null;
  isLoadingHide?: boolean;
  isCache?: boolean;
  sync?: boolean;
}
export default class RequestQueue {
  // task: 重复请求（参数一致）
  private _requestTaskMap: { [key: string]: Set<string> } = {};

  // job: 重复请求（参数不一致）
  private _requestJobMap: { [key: string]: Array<string> } = {};

  private _requestOptionMap: Map<string, RequestOption> = new Map();

  setRequestJob(requestUrl: string, hashKey: string, option: RequestOption) {
    if (!this.isRequestJobPending(requestUrl, hashKey)) {
      const request = this._requestJobMap[requestUrl];
      if (request) {
        if (request.length === 2) {
          const deleteHashKey = request.splice(1, 1, hashKey);
          this._requestJobMap[requestUrl] = request;
          this._requestOptionMap.delete(deleteHashKey[0]);
          this._requestOptionMap.set(hashKey, option);
        } else {
          request.push(hashKey);
        }
      } else {
        this._requestJobMap[requestUrl] = [hashKey];
      }
    }
  }

  removeRequestJob(
    requestUrl: string,
    hashKey: string,
  ): RequestOption | undefined {
    const request = this._requestJobMap[requestUrl];
    if (request) {
      const hashKeyIndex = request.findIndex((item) => item === hashKey);
      if (hashKeyIndex > -1) {
        request.splice(hashKeyIndex, 1);
      }
      if (request.length > 0) {
        return this._requestOptionMap.get(request[0]);
      }
      return undefined;
    }
    return undefined;
  }

  isRequestJobPending(requestUrl: string, hashKey: string) {
    const request = this._requestJobMap[requestUrl];
    if (request) {
      const hashKeyIndex = request.findIndex((item) => item === hashKey);
      if (hashKeyIndex > -1) {
        return true;
      }
      return false;
    }
    return false;
  }

  setRequestTask(requestUrl: string, hashKey: string) {
    if (!this.isRequestTaskPending(requestUrl, hashKey)) {
      const request = this._requestTaskMap[requestUrl];
      if (request) {
        request.add(hashKey);
      }
      this._requestTaskMap[requestUrl] = new Set([hashKey]);
    }
  }

  removeRequestTask(requestUrl: string, hashKey: string) {
    if (this.isRequestTaskPending(requestUrl, hashKey)) {
      const request = this._requestTaskMap[requestUrl];
      if (request) {
        request.delete(hashKey);
      }
    }
  }

  isRequestTaskPending(requestUrl: string, hashKey: string): boolean {
    const request = this._requestTaskMap[requestUrl];
    if (request) {
      const requestHash = request.has(hashKey);
      if (requestHash) {
        return true;
      }
      return false;
    }
    return false;
  }
}
