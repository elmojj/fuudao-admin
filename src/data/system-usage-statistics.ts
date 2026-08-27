/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

export interface StatisticsLoginData {
  /** 登录月数据 */
  loginSituations: {
    /** 登录次数 */
    loginTimes: number;
    /** 登录用户数 */
    loginUsers: number;
    /** 水司登录次数 */
    loginTimesOfWaterDepartment: number;
    /** 水司登录用户数 */
    loginUsersOfWaterDepartment: number;
  };
  /** 登录日数据 */
  dailyLoginSituations: {
    /** 日期 */
    date: string;
    /** 登录次数 */
    loginTimes: number;
    /** 登录用户数 */
    loginUsers: number;
  }[];
}

export interface StatisticsUsageData {
  /** 使用月数据 */
  usageSituations: {
    /** 详细方案计算 */
    detailedScheme: number;
    /** 快速方案计算 */
    quickScheme: number;
    /** 警告处理次数 */
    warnProcessTimes: number;
    /** 短信发送次数 */
    smsSendTimes: number;
  };
  /** 使用日数据 */
  dailyUsageSituations: {
    /** 日期 */
    date: string;
    /** 详细方案计算 */
    detailedScheme: number;
    /** 快速方案计算 */
    quickScheme: number;
    /** 警告处理次数 */
    warnProcessTimes: number;
    /** 短信发送次数 */
    smsSendTimes: number;
  }[];
}

export interface StatisticsWarnData {
  warnSituations?: Record<string, number>;
  dailyWarnSituations?: Record<string, number>[];
}

export interface ModelServiceItem {
  name: string;
  value: number;
}
