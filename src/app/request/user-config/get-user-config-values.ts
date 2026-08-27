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

export interface GetUserConfigValuesResponse extends APIResponse {
  searchHistory?: Array<string>;
  themeName?: Theme;
  labelTitle?: boolean;
  labelIndicator?: boolean;
  labelSimulation?: boolean;
  appLabelTitle?: boolean;
  appLabelIndicator?: boolean;
  appLabelSimulation?: boolean;
  chartWarnMark?: boolean;
  chartShowMaxLimitation?: boolean;
  chartShowMaxMinRange?: boolean;
}

export async function getUserConfigValues(
  type: string,
): Promise<GetUserConfigValuesResponse> {
  const data: any = await postRequest({
    code: 'portal/getUserConfigValues',
    params: {
      type,
      application_id: APP_NAME,
    },
  });

  if (data.json_ok && data.configs) {
    const theme = data.configs.themeColorVars;
    let themeName: Theme = 'light';
    if (theme === 'dark') themeName = 'dark';

    const {
      historySearchWord,
      overlayLabelTitle,
      overlayLabelIndicator,
      overlayLabelSimulation,
      appOverlayLabelTitle,
      appOverlayLabelIndicator,
      appOverlayLabelSimulation,
      chartShowWarnMark,
      chartMaxLimitation,
      chartShowRange,
    } = data.configs;
    const searchHistory = historySearchWord
      ? JSON.parse(historySearchWord)
      : undefined;
    const labelTitle =
      typeof overlayLabelTitle === 'undefined'
        ? true
        : JSON.parse(overlayLabelTitle);
    const labelIndicator =
      typeof overlayLabelIndicator === 'undefined'
        ? true
        : JSON.parse(overlayLabelIndicator);
    const labelSimulation =
      typeof overlayLabelSimulation === 'undefined'
        ? false
        : JSON.parse(overlayLabelSimulation);
    const appLabelTitle =
      typeof appOverlayLabelTitle === 'undefined'
        ? true
        : JSON.parse(appOverlayLabelTitle);
    const appLabelIndicator =
      typeof appOverlayLabelIndicator === 'undefined'
        ? true
        : JSON.parse(appOverlayLabelIndicator);
    const appLabelSimulation =
      typeof appOverlayLabelSimulation === 'undefined'
        ? false
        : JSON.parse(appOverlayLabelSimulation);
    const chartWarnMark =
      typeof chartShowWarnMark === 'undefined'
        ? true
        : JSON.parse(chartShowWarnMark);
    const chartShowMaxLimitation =
      typeof chartMaxLimitation === 'undefined'
        ? true
        : JSON.parse(chartMaxLimitation);
    const chartShowMaxMinRange =
      typeof chartShowRange === 'undefined' ? true : JSON.parse(chartShowRange);
    return {
      status: 'Success',
      themeName,
      searchHistory,
      labelTitle,
      labelIndicator,
      labelSimulation,
      appLabelTitle,
      appLabelIndicator,
      appLabelSimulation,
      chartWarnMark,
      chartShowMaxLimitation,
      chartShowMaxMinRange,
    };
  }

  return {
    status: 'Fail',
    errorMessage: data.json_msg,
  };
}
