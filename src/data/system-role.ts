/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { DataNode } from 'antd/es/tree';
import { MenuInfo } from './menu-data';

export interface SystemRoleItem {
  roleDescription?: string;
  roleId: string;
  roleName: string;
}

export type SystemRoleList = SystemRoleItem[];

type treeDataItem = DataNode & { parentKey: string };

export const getFunctionTreeData = (
  list: Array<MenuInfo>,
  rootId: string,
): DataNode[] => {
  const formatList: Array<treeDataItem> = list.map((item) => ({
    key: item.id,
    title: item.name,
    parentKey: item.parentId,
  }));
  const mapList = new Map<treeDataItem['key'], treeDataItem>();
  const treeData: DataNode[] = [];

  formatList.forEach((item) => {
    mapList.set(item.key, item);
  });

  formatList.forEach((item) => {
    const parent = mapList.get(item.parentKey);

    if (parent) {
      parent.children = parent.children || [];
      parent.children.push(item);
    }
  });

  mapList.forEach((value) => {
    if (value.parentKey === rootId) {
      treeData.push(value);
    }
  });

  return treeData;
};

export const getLeafNode = (
  list: DataNode[],
  key: string,
): DataNode | undefined => {
  let node: DataNode | undefined;

  for (let i = 0; i < list.length; i += 1) {
    if (typeof node !== 'undefined' && !node.children) return node;
    if (list[i].key === key) {
      node = list[i];
    }
    if (Array.isArray(list[i].children)) {
      node = getLeafNode(list[i].children!, key);
    }
  }
  return node;
};
