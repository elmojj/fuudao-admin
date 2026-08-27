/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { MENU_TYPE_FUNC, MENU_TYPE_PAGE, MenuInfo } from './menu-data';
import { loopTreeList, transListToTree } from './tree';

export type MenuId = MenuInfo['id'];

export enum FeatureCode {
  /** 新增阀门记录 */
  VALVE_ADD_RECORD = 'FEATURE_VALVE_ADD_RECORD',
  /** 下载数据： 基础数据和延时数据 */
  DOWNLOAD_SCADA = 'FEATURE_DOWNLOAD_SCADA',
  /** 公共关注点编辑 */
  UPDATE_OBSERVATION = 'FEATURE_UPDATE_OBSERVATION',
  /** 添加智慧阀门关联关系 */
  VALVE_ADD_SCADA_RELATION = 'FEATURE_VALVE_ADD_SCADA_RELATION',
  /** 创建方案 */
  CREATE_SOLUTION = 'FEATURE_CREATE_SOLUTION',

  /** 计划事件增删改 */
  EDITABLE_PLAN_PROJECTION = 'FEATURE_EDITABLE_PLAN_PROJECTION',
}

export class SystemPage {
  private _pageInfo: MenuInfo;

  private _featureMap: Map<FeatureCode, MenuInfo> = new Map();

  constructor(data: MenuInfo) {
    this._pageInfo = data;
    if (data.type === MENU_TYPE_PAGE && data?.children?.length) {
      this.initializeFeature(data.children);
    }
  }

  initializeFeature(menuList: MenuInfo[]) {
    menuList.forEach((menuInfo) => {
      if (
        menuInfo.type === MENU_TYPE_FUNC &&
        !this._featureMap.has(menuInfo.functionKey as FeatureCode)
      ) {
        this._featureMap.set(menuInfo.functionKey as FeatureCode, menuInfo);
      }
    });
  }

  hasFeatureInfo(featureCode: FeatureCode): boolean {
    return this._featureMap.has(featureCode);
  }

  get info(): MenuInfo {
    return this._pageInfo;
  }
}

export function generateSystemPage(data: MenuInfo): SystemPage {
  return new SystemPage(data);
}

class SystemFeatureManagement {
  static getInstance(): SystemFeatureManagement {
    if (SystemFeatureManagement._instance === undefined) {
      SystemFeatureManagement._instance = new SystemFeatureManagement();
    }
    return SystemFeatureManagement._instance;
  }

  private _pageMap: Map<MenuId, SystemPage> = new Map();

  // eslint-disable-next-line no-use-before-define
  private static _instance: SystemFeatureManagement;

  registerSystemFeatures(menuList: MenuInfo[]) {
    this._pageMap.clear();
    const menuTree = transListToTree<MenuInfo>(menuList, 'id', 'parentId');
    if (menuTree && menuTree.length) {
      loopTreeList(menuTree, this.setPageMap.bind(this));
    }
  }

  private setPageMap(menuInfo: MenuInfo) {
    if (
      menuInfo.type === MENU_TYPE_PAGE &&
      !this._pageMap.has(menuInfo.id as MenuId)
    ) {
      this._pageMap.set(menuInfo.id as MenuId, generateSystemPage(menuInfo));
    }
  }

  hasPageInfo(menuId: MenuId): boolean {
    return this._pageMap.has(menuId);
  }

  hasFeatureInfo(menuId: MenuId, featureCode: FeatureCode): boolean {
    const pageInfo = this._pageMap.get(menuId);
    if (!pageInfo) return false;
    return pageInfo.hasFeatureInfo(featureCode);
  }
}

export function pageEnabled(menuId: MenuId | undefined): boolean {
  if (typeof menuId === 'undefined') return false;
  return SystemFeatureManagement.getInstance().hasPageInfo(menuId);
}

export function featureEnabled(
  menuId: MenuId | undefined,
  featureCode: FeatureCode,
): boolean {
  if (typeof menuId === 'undefined') return false;
  return SystemFeatureManagement.getInstance().hasFeatureInfo(
    menuId,
    featureCode,
  );
}

export function registerSystemFeatures(menuList: MenuInfo[]) {
  SystemFeatureManagement.getInstance().registerSystemFeatures(menuList);
}
