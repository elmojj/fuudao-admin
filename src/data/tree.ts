/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { cloneDeep } from 'lodash';

type TreeDataItem<T> = T & { children?: T[] };

/**
 *
 * @param list 树结构平铺的列表
 * @param idKey list obj property name
 * @param parentIdKey list obj property name
 */
export const transListToTree = <L extends {}>(
  list: Array<L>,
  idKey: keyof L,
  parentIdKey: keyof L,
): TreeDataItem<L>[] => {
  const listData = cloneDeep(list);
  const treeData: TreeDataItem<L>[] = [];
  const mapList = new Map<string, L>();

  // taransfrom list to map
  listData.forEach((item) => {
    mapList.set(item[idKey] as string, item);
  });

  listData.forEach((item) => {
    const parent: TreeDataItem<L> | undefined = mapList.get(
      item[parentIdKey] as string,
    );

    if (parent) {
      parent.children = parent.children || [];
      parent.children.push(item);
      mapList.set(item[parentIdKey] as string, parent);
    } else {
      treeData.push(item);
    }
  });

  return treeData;
};

export const transTreeToList = <
  T extends TreeDataItem<{ [index: string]: any }>,
>(
  treeData: Array<T>,
): Array<Omit<T, 'children'>> => {
  let listData: Array<Omit<T, 'children'>> = [];
  for (let i = 0; i < treeData.length; i += 1) {
    const { children, ...rest } = treeData[i];
    listData.push(rest);
    if (Array.isArray(children)) {
      listData = [...listData, ...transTreeToList(children as T[])];
    }
  }
  return listData;
};

/**
 * 递归查找指定节点
 * @param treeData  treeData
 * @param keyName 指定节点的属性名
 * @param key  指定节点的属性名的值, 全等匹配
 * @returns 指定的节点
 */
export const getTreeDataNode = <
  T extends TreeDataItem<{ [index: string]: any }>,
  K extends keyof T,
>(
  treeData: T[],
  keyName: K,
  key: T[K],
): T | undefined => {
  let node: T | undefined;
  for (let i = 0; i < treeData.length; i += 1) {
    if (node) return node;
    if (treeData[i][keyName] === key) {
      return treeData[i];
    }
    if (Array.isArray(treeData[i].children)) {
      node = getTreeDataNode(treeData[i].children as T[], keyName, key);
    }
  }
  return node;
};

/**
 * 递归遍历树， 执行回调
 * @param treeData
 * @param callback
 */
export const loopTreeList = <T extends TreeDataItem<{ [index: string]: any }>>(
  treeData: T[],
  callback?: (value: T) => void,
): void => {
  for (let i = 0; i < treeData.length; i += 1) {
    callback?.(treeData[i]);
    if (typeof treeData[i]?.children !== 'undefined' && treeData[i]?.children)
      loopTreeList(treeData[i].children as T[], callback);
  }
};

/** 获取指定树节点下面所有子节点信息
 * @param list
 * @param idKey 指定节点id
 */
export const getChildrenFromTreeData = <
  T extends TreeDataItem<{ [index: string]: any }>,
  K extends keyof T,
>(
  treeList: T[],
  id: T[K],
): T[] => {
  const childrens: T[] = [];
  const node = getTreeDataNode(treeList, 'id' as keyof T, id);
  if (node && node.children?.length) {
    loopTreeList(node.children, (item) => {
      childrens.push(item as T);
    });
  }
  return childrens;
};

export const getParentFromTreeData = <
  T extends TreeDataItem<{ [index: string]: any }>,
  K extends keyof T,
>(
  treeData: T[],
  keyName: K,
  key: T[K],
): T | undefined => {
  let parent: T | undefined;
  for (let i = 0; i < treeData.length; i += 1) {
    if (parent) return parent;
    const node = treeData[i];
    if (node.children) {
      if (node.children.some((item) => item[keyName as string] === key)) {
        parent = node;
      } else {
        parent = getParentFromTreeData(
          node.children,
          keyName as string,
          key,
        ) as T | undefined;
      }
    }
  }
  return parent;
};
