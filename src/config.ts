/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.
*/

interface HSConfig {
  HSWEBSERVER: string;
  APPNAME: string;
  SYSTEM_CONFIG: {
    systemName: string;
    systemSubTitle: string;
    systemSubTitleColor?: string;
    showWatermark: boolean;
    watermarkImage: string;
    logoImage: string;
    loginLogoImage: string;
    loginBackgroundImage: string;
    appLoginBackgroundImage: string;
  };
  weComAgentId: number | string;
  mobile?: boolean;
  appDeviceDetect?: string;
  loginValidation?: boolean;
}

interface MyWindow extends Window {
  HSConfig?: HSConfig;
}

const defaultSystemConfig: HSConfig['SYSTEM_CONFIG'] = {
  systemName: '富游岛后台',
  systemSubTitle: '富游岛管理后台',
  showWatermark: false,
  watermarkImage: 'system-watermark',
  logoImage: 'system-logo',
  loginLogoImage: 'login-logo',
  loginBackgroundImage: 'login-background',
  appLoginBackgroundImage: 'app-login-background',
};

function getLocalBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/`;
  }
  return 'http://localhost:3000/';
}

function getHSConfig(): HSConfig {
  if (typeof window === 'undefined') {
    return {
      HSWEBSERVER: getLocalBaseUrl(),
      APPNAME: 'SUPPLY_SCHEDULING',
      SYSTEM_CONFIG: defaultSystemConfig,
      weComAgentId: 1000003,
      loginValidation: true,
    };
  }

  const win = window as MyWindow;
  return {
    HSWEBSERVER:
      win.HSConfig?.HSWEBSERVER?.replace('{ORIGIN}', window.location.origin) ||
      getLocalBaseUrl(),
    APPNAME: win.HSConfig?.APPNAME || 'SUPPLY_SCHEDULING',
    SYSTEM_CONFIG: win.HSConfig?.SYSTEM_CONFIG || defaultSystemConfig,
    weComAgentId: win.HSConfig?.weComAgentId || 1000003,
    mobile: win.HSConfig?.mobile,
    appDeviceDetect: win.HSConfig?.appDeviceDetect,
    loginValidation: win.HSConfig?.loginValidation ?? true,
  };
}

const hsConfig = getHSConfig();

export const ICONFONT_URL = './iconfont/iconfont.js';

export const BASE_URL: string = hsConfig.HSWEBSERVER;

export const TIMEOUT = 120000;

export const APP_NAME = hsConfig.APPNAME;

export const SYSTEM_CONFIG = hsConfig.SYSTEM_CONFIG;

export const SYSTEM_ICON_BASE_PATH = `${BASE_URL}portal/getImage?fileName=`;

export const WeComAgentId = hsConfig.weComAgentId;

export const appDeviceDetect = hsConfig.appDeviceDetect;

export const MOBILE = hsConfig.mobile;

export const LOGIN_VALIDATION = hsConfig.loginValidation;

export function getRuntimeConfig() {
  return getHSConfig();
}
