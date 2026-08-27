/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

export interface UrlParams {
  path?: string;
  app?: boolean;
  token?: string;
  pageHeader?: string;
}

export function getUrlParams(locationSearch: string): UrlParams {
  const urlparamObject: { [key: string]: string } = {};
  if (locationSearch.indexOf('?') === -1) {
    return {};
  }
  const urlParams: string = locationSearch.slice(1);
  const urlParamsArray: string[] = urlParams.split('&');
  urlParamsArray.forEach((item) => {
    const temp: string[] = item.split('=');
    const key = temp[0];
    // eslint-disable-next-line prefer-destructuring
    urlparamObject[key] = temp[1];
  });
  return urlparamObject;
}
