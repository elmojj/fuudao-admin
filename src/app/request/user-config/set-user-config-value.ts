/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { postRequest } from 'src/app/host-app';
import { APP_NAME } from 'src/config';
import { Theme } from 'src/styles/theme/theme';
import { APIResponse } from '../api/api-response';

export async function setUserConfigValue(
  type: string,
  key: string,
  value: string | undefined,
): Promise<APIResponse> {
  const data: any = await postRequest({
    code: 'portal/setUserConfigValue',
    params: {
      type,
      key,
      value,
      application_id: APP_NAME,
    },
  });

  if (data.json_ok) {
    return {
      status: 'Success',
    };
  }

  return {
    status: 'Fail',
    errorMessage: data.json_msg,
  };
}

export async function saveSearchHistory(historyItems: string[]) {
  await setUserConfigValue(
    'userConfig',
    'historySearchWord',
    JSON.stringify(historyItems),
  );
}

export async function saveThemeName(theme: Theme) {
  await setUserConfigValue('userConfig', 'themeColorVars', theme);
}

export async function saveOverlayLabelTitle(labelTitle: boolean) {
  await setUserConfigValue(
    'userConfig',
    'overlayLabelTitle',
    JSON.stringify(labelTitle),
  );
}

export async function saveOverlayLabelIndicator(labelIndicator: boolean) {
  await setUserConfigValue(
    'userConfig',
    'overlayLabelIndicator',
    JSON.stringify(labelIndicator),
  );
}

export async function saveOverlayLabelSimulation(labelSimulation: boolean) {
  await setUserConfigValue(
    'userConfig',
    'overlayLabelSimulation',
    JSON.stringify(labelSimulation),
  );
}

export async function saveAppOverlayLabelTitle(labelTitle: boolean) {
  await setUserConfigValue(
    'userConfig',
    'appOverlayLabelTitle',
    JSON.stringify(labelTitle),
  );
}

export async function saveAppOverlayLabelIndicator(labelIndicator: boolean) {
  await setUserConfigValue(
    'userConfig',
    'appOverlayLabelIndicator',
    JSON.stringify(labelIndicator),
  );
}

export async function saveAppOverlayLabelSimulation(labelSimulation: boolean) {
  await setUserConfigValue(
    'userConfig',
    'appOverlayLabelSimulation',
    JSON.stringify(labelSimulation),
  );
}

export async function saveChartShowWarnMark(chartShowWarnMark: boolean) {
  await setUserConfigValue(
    'userConfig',
    'chartShowWarnMark',
    JSON.stringify(chartShowWarnMark),
  );
}

export async function saveMaxLimitation(chartMaxLimitation: boolean) {
  await setUserConfigValue(
    'userConfig',
    'chartMaxLimitation',
    JSON.stringify(chartMaxLimitation),
  );
}

export async function saveShowRange(chartShowRange: boolean) {
  await setUserConfigValue(
    'userConfig',
    'chartShowRange',
    JSON.stringify(chartShowRange),
  );
}
