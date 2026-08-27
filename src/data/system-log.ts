/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

export interface SystemLogDataItem {
  addressId: string;
  applicationName: string;
  applyId: string;
  operationDesc: string;
  // string as YYYY-DD-MM hh:mm:ss
  operationTime: string;
  operationType: string;
  recordId: string;
  sourceDesc: string;
  userId: string;
  userName: string;
}

export interface GetSystemLogParams {
  page: number;
  pageSize: number;
  keyWord?: string;
  /** string as YYYY-MM-DD */
  startDate?: string;
  endDate?: string;
  operationType?: string;
}

export const SYSTEM_OPERATION_TYPE = [
  {
    label: '用户登录',
    value: 'USER_LOGIN',
  },
  {
    label: '创建用户',
    value: 'CREATE_USER',
  },
  {
    label: '删除用户',
    value: 'DELETE_USER',
  },
  {
    label: '修改密码',
    value: 'CHANGE_PASSWORD',
  },
  {
    label: '调整菜单',
    value: 'CHANGE_MENU',
  },
  {
    label: '修改角色',
    value: 'CHANGE_ROLE',
  },
];
