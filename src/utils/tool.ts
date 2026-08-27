/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import dayjs, { Dayjs } from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { ExternalUserInfo } from 'src/app/request/login/types';
import { Theme } from 'src/styles/theme/theme';

dayjs.extend(duration);

export interface BaseUserInfo {
  userEmail: string;
  userPhone: string;
  /** string as '男' */
  userSex: string;
  userName: string;
  departmentId: string;
  departmentName: string;
  externalUserInfo: ExternalUserInfo;
}

export const getThemeFromLocal = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  return (globalThis.localStorage.getItem('theme') as Theme) || 'light';
};

export const setThemeToLocal = (theme: Theme) => {
  if (typeof window === 'undefined') return;
  globalThis.localStorage.setItem('theme', theme);
};

export const getThemeTokenFromLocal = (): any => {
  if (typeof window === 'undefined') return undefined;
  try {
    const themeTokenStr = globalThis.localStorage.getItem('themeToken');
    if (themeTokenStr) {
      return JSON.parse(themeTokenStr);
    }
    return undefined;
  } catch (err) {
    console.log(err);
    return undefined;
  }
};

export const setThemeTokenToLocal = (themeToken: any) => {
  if (typeof window === 'undefined') return;
  try {
    if (themeToken) {
      const themeTokenStr = JSON.stringify(themeToken);
      globalThis.localStorage.setItem('themeToken', themeTokenStr);
    }
  } catch (err) {
    console.log(err);
  }
};

export const getUserInfoFromLocal = (): BaseUserInfo => {
  if (typeof window === 'undefined') {
    return {
      userEmail: '',
      userPhone: '',
      userSex: '',
      userName: '',
      departmentId: '',
      departmentName: '',
      externalUserInfo: {},
    };
  }
  const userInfoStr = globalThis.localStorage.getItem('userInfo');
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : {};
  return {
    userEmail: userInfo.userEmail ?? '',
    userPhone: userInfo.userPhone ?? '',
    userSex: userInfo.userSex ?? '',
    userName: userInfo.userName ?? '',
    departmentId: userInfo.departmentId ?? '',
    departmentName: userInfo.departmentName ?? '',
    externalUserInfo: userInfo.externalUserInfo ?? {},
  };
};

export const rangePresets: {
  label: string;
  value: [Dayjs, Dayjs];
}[] = [
  { label: '近3天', value: [dayjs().add(-2, 'd'), dayjs()] },
  { label: '近7天', value: [dayjs().add(-6, 'd'), dayjs()] },
  { label: '近一月', value: [dayjs().add(-30, 'd'), dayjs()] },
  { label: '近三月', value: [dayjs().add(-90, 'd'), dayjs()] },
];

export const getRandomIntInclusive = (min: number, max: number): number => {
  const minValue = Math.ceil(min);
  const maxValue = Math.floor(max);
  return Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
};
