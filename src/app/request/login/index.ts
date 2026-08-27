/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { AES } from 'crypto-js';
import enc from 'crypto-js/enc-utf8';
import { getRequest, postRequest } from 'src/app/host-app';
import { MenuInfo } from 'src/data/menu-data';
import { registerSystemFeatures } from 'src/data/system-feature';
import type { CaptchaResponse, LoginResponse } from './types';

const PUBLIC_KEY =
  'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8Qa+e4QjNlfSR55RGHeltMDqYJR1UCCpWzqY0xV9rgcGKXB3PzvBwn5PUUzPehGHHDXrpU4/gmcDZCjJly9hoI9NPKtjhi3bRFV7aHX0B4ms0S2ImYKtdRR7uSQfJPQFwr6fVOCs2bcPcJMYmSuJZXRKO/Fr7ZD5Uhlkcg5KGzQIDAQAB';

export function pwdEncrypt(pwd: string): string {
  if (typeof window === 'undefined') return pwd;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const JSEncrypt = require('jsencrypt') as typeof import('jsencrypt');
  const jsEncrypt = new JSEncrypt.default({});
  jsEncrypt.setPublicKey(PUBLIC_KEY);
  const encrypted = jsEncrypt.encrypt(pwd);
  if (encrypted === false) return pwd;
  return encrypted;
}

export function encrypt(keyWord: string) {
  return AES.encrypt(keyWord, 'info-water').toString();
}
export function decrypt(keyWord: string): string {
  return AES.decrypt(keyWord, 'info-water').toString(enc);
}

export const pingLoginRequest = () => {
  setTimeout(() => {
    postRequest({
      code: 'portal/pingLogin',
      params: {},
    }).then((res: any) => {
      if (res.json_ok) {
        pingLoginRequest();
      }
    });
  }, 300000);
};

export type {
  CaptchaResponse,
  ExternalUserInfo,
  LoginResponse,
  UserInfoType,
} from './types';

export async function requestLogin(  username: string,
  password: string,
  captcha?: string,
): Promise<LoginResponse> {
  const params = {
    username,
    password, // pwdEncrypt(password),
    code: captcha,
  };

  return postRequest({
    code: 'system/user/login',
    params,
  }).then((res: any) => {
    if (res.code === 200) {
      return {
        status: 'Success',
        sessionId: res.data.token,
      };
    }

    return {
      status: 'Fail',
      errorMessage: res.message,
    };
  });
}

export async function getCaptcha(): Promise<CaptchaResponse> {
  return getRequest({
    code: 'system/user/getCaptcha',
    params: {},
  }).then((res: any) => {
    if (res.code === 200) {
      return {
        status: 'Success',
        url: res.data.base64Captcha,
        content: res.data.content,
      };
    }

    return {
      status: 'Fail',
      errorMessage: res.message,
    };
  });
}

export async function logout(): Promise<{ status: 'Success' | 'Fail'; errorMessage?: string }> {
  const res: any = await postRequest({
    code: '/logout',
  });

  if (res.json_ok) {
    return {
      status: 'Success',
    };
  }

  return {
    status: 'Fail',
    errorMessage: res.json_msg,
  };
}

export function setPermissionList(menuList: Array<MenuInfo>) {
  const permissionFeatureList: MenuInfo[] = [];
  menuList.forEach((item) => {
    let dataMode = '';
    if (item.parentId === '') {
      dataMode = 'default';
      if (item.dataMode) {
        dataMode = item.dataMode;
      }
    }
    const menuInfo: MenuInfo = {
      ...item,
      parentId: item.parentId ?? 'default',
      dataMode,
    };
    permissionFeatureList.push(menuInfo);
  });
  registerSystemFeatures(permissionFeatureList);
}

export function onLoginSuccess(response: LoginResponse) {
  if (response?.sessionId) localStorage.setItem('token', response?.sessionId);

  // pingLoginRequest();
}
