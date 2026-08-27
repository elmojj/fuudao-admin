/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { FeatureCode, featureEnabled } from './system-feature';

export enum SidebarMenuType {
  /** 方案计算 */
  SOLUTION_SIMULATION = 'SOLUTION_SIMULATION',
  /** 警告 */
  WARN = 'WARN',
  /** 关阀分析 */
  VALVE_ANALYSIS = 'VALVE_ANALYSIS',
  /** 爆管冲洗 */
  BURST_PIPE_FLUSHING = 'BURST_PIPE_FLUSHING',
  /** 综合调度 */
  SCHEDULING_ANALYSIS = 'SCHEDULING_ANALYSIS',
  /** 创建方案 */
  SOLUTION_CREATE = 'SOLUTION_CREATE',
  /** 方案列表 */
  SOLUTION_LIST = 'SOLUTION_LIST',
  /** 方案对比 */
  SOLUTION_COMPARE = 'SOLUTION_COMPARE',
  /** 去向追踪 */
  DOWNSTREAM_TRACKING = 'DOWNSTREAM_TRACKING',
  /** 来源追踪 */
  UPSTREAM_TRACKING = 'UPSTREAM_TRACKING',
  /** 污染溯源 */
  POLLUTION_SOURCE_TRACING = 'POLLUTION_SOURCE_TRACING',
  /** 自定义追踪 */
  CUSTOM_TRACKING = 'CUSTOM_TRACKING',
  /** 设备评估 */
  DEVICE_EVALUATION = 'DEVICE_EVALUATION',
  /** 计算日志 */
  SIMULATION_LOG = 'SIMULATION_LOG',
  /** 智慧阀门 */
  SMART_VALVE_MANAGEMENT = 'SMART_VALVE_MANAGEMENT',
  /** 关闭的阀门 */
  CLOSE_VALVE_MANAGEMENT = 'CLOSE_VALVE_MANAGEMENT',
  /** 阀门管理 */
  VALVE_MANAGEMENT = 'VALVE_MANAGEMENT',
  /** 关阀事件 */
  VALVE_GROUP = 'VALVE_GROUP',
  /** 阀门管理 和 关阀事件 */
  VALVE_MANAGEMENT_AND_GROUP = 'VALVE_MANAGEMENT_AND_GROUP',
  /** 下载数据 */
  DOWNLOAD_SCADA_DATA = 'DOWNLOAD_SCADA_DATA',
  /** 水量统计 */
  WATER_VOLUME_STATISTICS = 'WATER_VOLUME_STATISTICS',
  /** 对象批量查询 */
  BATCH_QUERY = 'BATCH_QUERY',
  /** 场景 */
  SCENE_RUN = 'RUN',
  SCENE_SCADA = 'SCADA',
  SCENE_MODEL = 'MODEL',
  SCENE_SCHEME = 'SCHEME',
  /** 问题上报 */
  ISSUE_REPORT = 'ISSUE_REPORT',
  /** 调度 */
  SCHEDULE = 'SCHEDULE',
  /** 大方案快速对比 */
  SOLUTION_ANALYSIS = 'SOLUTION_ANALYSIS',
  /** 警告看板 */
  WARNING = 'WARNING',
  /* 设备状态记录 */
  DEVICE_STATE_RECORDS = 'DEVICE_STATE_RECORDS',
  /** 工单 */
  WORK_ORDER = 'WORK_ORDER',
  QUICK_SOLUTION_LIST = 'QUICK_SOLUTION_LIST',
  /** 停水通 */
  WATER_OUTAGE_INFO = 'WATER_OUTAGE_INFO',
  /** 设备维修 */
  WORK_ORDER_REPAIR_DETAIL = 'WORK_ORDER_REPAIR_DETAIL',
}

const sidebarMenuNameMap: { [key in SidebarMenuType]?: string } = {
  [SidebarMenuType.WARN]: '警告',
  [SidebarMenuType.VALVE_ANALYSIS]: '关阀分析',
  [SidebarMenuType.BURST_PIPE_FLUSHING]: '爆管冲洗',
  [SidebarMenuType.SCHEDULING_ANALYSIS]: '综合调度',
  [SidebarMenuType.SOLUTION_CREATE]: '创建方案',
  [SidebarMenuType.SOLUTION_LIST]: '方案列表',
  [SidebarMenuType.SOLUTION_COMPARE]: '方案对比',
  [SidebarMenuType.DOWNSTREAM_TRACKING]: '去向追踪',
  [SidebarMenuType.UPSTREAM_TRACKING]: '来源追踪',
  [SidebarMenuType.POLLUTION_SOURCE_TRACING]: '污染溯源',
  [SidebarMenuType.CUSTOM_TRACKING]: '自定义追踪',
  [SidebarMenuType.DEVICE_EVALUATION]: '设备评估',
  [SidebarMenuType.SIMULATION_LOG]: '计算日志',
  [SidebarMenuType.SMART_VALVE_MANAGEMENT]: '智慧阀门',
  [SidebarMenuType.VALVE_MANAGEMENT]: '阀门管理',
  [SidebarMenuType.DOWNLOAD_SCADA_DATA]: '下载数据',
  [SidebarMenuType.WATER_VOLUME_STATISTICS]: '水量统计',
  [SidebarMenuType.BATCH_QUERY]: '对象批量查询',
  [SidebarMenuType.ISSUE_REPORT]: '问题上报',
  [SidebarMenuType.SCHEDULE]: '调度',
  [SidebarMenuType.SOLUTION_ANALYSIS]: '快速对比',
  [SidebarMenuType.WORK_ORDER]: '工单查询',
  [SidebarMenuType.WATER_OUTAGE_INFO]: '停水通',
  [SidebarMenuType.WORK_ORDER_REPAIR_DETAIL]: '设备维修',
};

export type IconType = 'ANTD' | 'ICONFONT';

export type SidebarMenuItem<T = unknown> = {
  key: string;
  className?: string;
  title?: string;
  icon?: string;
  iconType?: IconType;
  hasDivider?: boolean;
  help?: string;
  children?: SidebarMenuItem<T>[];
} & T;

export type SidebarMenuItemWithBadge = SidebarMenuItem<{ badge?: number }>;

export function getSidebarMenuName(menuType: string): string {
  return sidebarMenuNameMap[menuType as SidebarMenuType] ?? menuType;
}

export function shouldIncludeItem(
  item: SidebarMenuItem,
  menuId?: string,
): boolean {
  switch (item.key) {
    case SidebarMenuType.SOLUTION_CREATE:
      return featureEnabled(menuId, FeatureCode.CREATE_SOLUTION);

    case SidebarMenuType.DOWNLOAD_SCADA_DATA:
      return featureEnabled(menuId, FeatureCode.DOWNLOAD_SCADA);

    default:
      return true;
  }
}

export function findMenuItem(
  menuKey: string,
  menuData: SidebarMenuItem[],
): SidebarMenuItem | undefined {
  return menuData.find((f) => {
    if (f.key === menuKey) return f;
    if (f.children) return findMenuItem(menuKey, f.children);
    return undefined;
  });
}

export function injectBadgeToMenu(
  menuData: Array<SidebarMenuItemWithBadge>,
  menuKey: string,
  badge: number,
): Array<SidebarMenuItemWithBadge> {
  const findAndInjectBadge = (
    items: Array<SidebarMenuItemWithBadge>,
    parentMenu?: SidebarMenuItemWithBadge,
  ): Array<SidebarMenuItemWithBadge> =>
    items.map((item) => {
      const newItem = { ...item };

      if (newItem.key === menuKey) {
        // 直接匹配到目标项，添加 badge 属性
        newItem.badge = badge === 0 ? undefined : badge;
        if (parentMenu && typeof parentMenu?.badge === 'undefined')
          // eslint-disable-next-line no-param-reassign
          parentMenu.badge = badge === 0 ? undefined : 0;
      }

      // 如果当前项有子菜单，递归处理子菜单
      if (newItem.children)
        newItem.children = findAndInjectBadge(newItem.children, newItem);

      return newItem;
    });

  return findAndInjectBadge(menuData);
}
