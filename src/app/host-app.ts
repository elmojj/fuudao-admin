/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { message } from 'antd';
import { BASE_URL } from 'src/config';
import { request } from './request/request';

type Callback = () => void;

export default class HostApp {
  // eslint-disable-next-line no-use-before-define
  private static _instance: HostApp;

  listeners: Callback[] = [];

  static getInstance(): HostApp {
    if (HostApp._instance == null) {
      HostApp._instance = new HostApp();
    }

    return HostApp._instance;
  }

  constructor() {
    this._viewId = '';
  }

  private _loginPage: string = '/login';

  get loginPage(): string {
    return this._loginPage;
  }

  set loginPage(path: string) {
    this._loginPage = path;
  }

  private _viewId: string;

  get viewId(): string {
    return this._viewId;
  }

  set viewId(id: string) {
    this._viewId = id;
  }

  subscribe(callback: Callback) {
    this.listeners.push(callback);
  }

  unsubscribe(callback: Callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  notifyAll() {
    this.listeners.forEach((callback) => callback());
  }

  initializeAppConfig() {
    this.notifyAll();
  }
}

export function hostApp(): HostApp {
  return HostApp.getInstance();
}

export function getServiceUrl(api: string): string {
  return `${BASE_URL}${api}`;
}

export async function postRequest(args: any) {
  const response = await request(
    {
      method: 'post',
      permissionCode: args.code,
      url: BASE_URL + args.code,
      data: args.params === undefined ? '' : args.params,
    },
    localStorage.getItem('token'),
  );

  if ((response as any).err_msg === '用户已登录但无权限') {
    message.error('用户已登录但无权限');
  }

  return response;
}

export function downloadRequest(args: any) {
  return request(
    {
      method: 'post',
      permissionCode: args.code,
      url: BASE_URL + args.code,
      responseType: 'blob',
      data: args.params === undefined ? '' : args.params,
    },
    localStorage.getItem('token'),
  ).then((res: any) => {
    const { headers, response } = res;
    const contentType = headers['Content-Type'];
    const contentDisposition = headers['Content-Disposition'];
    const fileName = contentDisposition
      ? decodeURI(
          response.headers['Content-Disposition'].split(';')[1].split('=')[1],
        )
      : `${new Date().getTime()}.xlsx`;
    const blob = new Blob([res.data], { type: contentType });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName; // 设置下载文件名
    link.click();
  });
}

export function getRequest(args: any) {
  return request(
    {
      method: 'get',
      permissionCode: args.code,
      url: BASE_URL + args.code,
      params: args.params,
    },
    localStorage.getItem('token'),
  );
}

export function uploadRequest(args: any) {
  return request(
    {
      method: 'post',
      maxBodyLength: Infinity,
      permissionCode: 'uploadFile',
      url: `${BASE_URL}file/upload`,
      data: args.params,
    },
    localStorage.getItem('token'),
  );
}
