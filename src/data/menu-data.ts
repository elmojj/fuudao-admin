/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import type { MenuProps } from 'antd';
// eslint-disable-next-line import/no-unresolved
import { getTreeDataNode, transTreeToList } from './tree';

export type MenuType = 'MENU' | 'FUNC' | 'PAGE' | 'URLMENU';
export const MENU_TYPE_MENU: MenuType = 'MENU';
export const MENU_TYPE_FUNC: MenuType = 'FUNC';
export const MENU_TYPE_PAGE: MenuType = 'PAGE';
export const MENU_TYPE_URLMENU: MenuType = 'URLMENU';

export type MenuItem = Required<MenuProps>['items'][number] & {
  children?: MenuItem[];
};

export interface MenuInfo {
  functionUrl?: string;
  // key
  code: string;
  functionKey: string;
  homepage?: boolean;
  icon?: string;
  id: string;
  name: string;
  parentId: string;
  showType?: string;
  type: MenuType;
  typeName?: string;
  url?: string;
  dataMode?: string;
  application?: string;
  note?: string;
  order?: number;
  status?: boolean;
  children?: MenuInfo[];
}

export type MenuList = MenuInfo[];

export interface MenuInfoItem {
  id: string;
  key: string;
  path: string;
  name: string;
  label: string;
  parentId: string;
  icon?: string;
  type: MenuType;
  url?: string;
  children?: MenuInfoItem[];
}

export interface UpdateMenuInfoParams {
  id: string;
  applicationId: string;
  name: string;
  type: Omit<MenuType, typeof MENU_TYPE_FUNC>;
  code?: string;
  order?: number;
  state: boolean;
  homepage: boolean;
  parentId?: string;
  note?: string;
  url?: string;
  showType?: string;
  icon?: string;
  functionList?: {
    id: string;
    name: string;
  }[];
}

export const MENU_TYPE = [
  {
    label: '导航',
    value: MENU_TYPE_MENU,
  },
  {
    label: '链接',
    value: MENU_TYPE_URLMENU,
  },
  {
    label: '页面',
    value: MENU_TYPE_PAGE,
  },
  {
    label: '功能',
    value: MENU_TYPE_FUNC,
  },
];

export const getMenuTreeData = (list: MenuInfoItem[]): MenuInfoItem[] => {
  const result: MenuInfoItem[] = [];
  const map: { [key: string]: MenuInfoItem } = {};
  list.forEach((listItem: MenuInfoItem) => {
    const item = listItem;
    item.key = item.id;
    map[item.id] = item;
  });

  list.forEach((item: MenuInfoItem) => {
    const parent = map[item.parentId];

    if (parent) {
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(item);
    } else {
      result.push(item);
    }
  });
  return result;
};

export const getMenuList = (list: MenuInfo[]): MenuInfoItem[] => {
  const menuList: MenuInfoItem[] = [];
  if (!list) {
    return [];
  }
  list.forEach((item) => {
    const { type, id, url, name, parentId } = item;
    if (
      type === MENU_TYPE_MENU ||
      type === MENU_TYPE_URLMENU ||
      type === MENU_TYPE_PAGE
    ) {
      const menuItem: MenuInfoItem = {
        id,
        key: id,
        path: url ?? id,
        label: name,
        name,
        parentId,
        type,
        url,
      };
      menuList.push(menuItem);
    }
  });

  return getMenuTreeData(menuList);
};

export const convertMenuData = (menuInfo: MenuInfoItem[]): MenuItem[] =>
  menuInfo.map((item) => {
    const { label, key, children } = item;

    const menuItem: MenuItem = {
      label,
      key,
    };

    if (children && children.length > 0) {
      menuItem.children = convertMenuData(children);
    }

    return menuItem;
  });

export const getMenuItemFromKeyPath = (
  menu: MenuInfoItem[],
  keyPath: string[],
): MenuInfoItem | undefined => {
  const foundMenuItem = menu.find((item) => item.key === keyPath[0]);
  if (keyPath.length === 1) return foundMenuItem;

  if (Array.isArray(foundMenuItem?.children)) {
    return getMenuItemFromKeyPath(foundMenuItem?.children!, keyPath.slice(1));
  }
  return undefined;
};

export const getMenuItemFromRoute = (
  menu: MenuInfoItem[],
  pathNames: string[],
): MenuInfoItem | undefined => {
  let item: MenuInfoItem | undefined;
  for (let i = 0; i < menu.length; i += 1) {
    if (typeof item !== 'undefined') return item;
    if (pathNames.includes(menu[i].path)) return menu[i];
    if (Array.isArray(menu[i]?.children)) {
      item = getMenuItemFromRoute(menu[i]?.children!, pathNames);
    }
  }
  return item;
};

export const getMenuChildrenIds = (
  menuId: string,
  menuTreeData: Array<MenuInfo & { children?: MenuInfo[] }>,
): Array<MenuInfo['id']> => {
  const menuItem = getTreeDataNode(menuTreeData, 'id', menuId);
  if (typeof menuItem === 'undefined') return [];
  const list = transTreeToList([menuItem]);
  return list.map((item) => item.id);
};
