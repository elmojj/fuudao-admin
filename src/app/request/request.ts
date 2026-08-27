/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import axios from 'axios';
import md5 from 'md5';
import { BASE_URL, TIMEOUT } from 'src/config';
import RedirectToLogin from './redirect-login';
import { RequestConfig } from './request-queue';

type ObjectAny = { [key: string]: any };

function sortObject(obj: ObjectAny): ObjectAny {
  const result: { [key: string]: any } = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      result[key] = obj[key];
    });
  return result;
}

let dataMode = '';

export function setCurrentDataMode(dataModeId: string) {
  dataMode = dataModeId;
}

export function getCurrentDataMode() {
  return dataMode;
}

export function getHashByConfig(config: RequestConfig) {
  const target = {
    methdod: config.method,
    url: config.url,
    params: config.params ? sortObject(config.params) : null,
    data: config.data ? sortObject(config.data) : null,
  };
  return md5(JSON.stringify(target));
}

const errorCode: { [key: number]: string } = {
  400: '错误代码: 400.',
  401: '错误代码: 401.未授权的访问',
  404: '错误代码: 404.请求地址不存在',
};

function createTokenInterceptors(
  config: RequestConfig,
  token?: string | null,
): RequestConfig | false {
  if (
    config.permissionCode === 'system/user/login' ||
    config.permissionCode === 'system/user/getCaptcha'
  ) {
    return config;
  }
  const requestHeader = config.headers;
  if (token && requestHeader) {
    requestHeader.Authorization = `Bearer ${token}`;
    if (config.permissionCode === 'uploadFile') {
      requestHeader['Content-Type'] = 'multipart/form-data';
      console.log(requestHeader);
    } else {
      requestHeader['Content-Type'] = 'application/json';
    }
    const axiosConfig = config;
    return axiosConfig;
  }
  RedirectToLogin();
  return false;
}

export function getPermission(): Record<string, boolean> {
  const localPermission: string | null = localStorage.getItem('permission');
  let permission: { [key: string]: boolean } = {};
  if (!localPermission) {
    permission = { login: true };
  } else {
    permission = JSON.parse(localPermission);
    permission.login = true;
    permission['portal/pingLogin'] = true;
    permission.getVersion = true;
  }
  return permission;
}

export function request(option: RequestConfig, token?: string | null) {
  return new Promise((resolve: any, reject) => {
    // 1.创建axios的实例
    const instance = axios.create({
      baseURL: BASE_URL,
      timeout: TIMEOUT,
    });

    instance.interceptors.request.use(
      (config: any): any => {
        const requestConfig = createTokenInterceptors(config, token);
        if (typeof requestConfig === 'boolean' && requestConfig === false)
          return Promise.reject(requestConfig);
        return requestConfig;
      },
      (err) => {
        console.error('来到了request拦截failure中');
        return err;
      },
    );

    instance.interceptors.response.use(
      (response) => {
        if (option.responseType === 'blob') return response;
        return response.data;
      },
      (err) => {
        if (err?.response) {
          let errorMessage = '其他错误信息';
          if (errorCode[err.response.status]) {
            errorMessage = errorCode[err.response.status];
          }
          console.error(errorMessage);
        }
        return err;
      },
    );

    instance(option)
      .then((res: any) => {
        if (res.response?.data.code === 401) {
          RedirectToLogin();
          return;
        }
        if (res.response?.data.code !== 0) {
          if (typeof res.json_msg === 'string') {
            console.error(res.json_msg);
            resolve(res);
          }
        }
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
