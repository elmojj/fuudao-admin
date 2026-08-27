import { GetBagListType } from 'src/app/request/bag-list';
import { DeliveryType } from 'src/app/request/logistic-list';
import {
  GetLotteryLevelListType,
  GetLotteryListType,
} from 'src/app/request/lottery-list';
import { MouseMode, RightPanelItem } from 'src/data/ui-types';

export enum BottomTabKey {
  CHARTS = 'CHARTS',
  PUMP_STATUS = 'PUMP_STATUS',
  VALVE_MANAGEMENT = 'VALVE_MANAGEMENT',
  VALVE_GROUP = 'VALVE_GROUP',
  CLOSE_VALVE = 'CLOSE_VALVE',
  WARN = 'WARN',
  ISSUE_REPORT = 'ISSUE_REPORT',
  DEVICE_STATE_RECORDS = 'DEVICE_STATE_RECORDS',
  WORK_ORDER = 'WORK_ORDER',
  WATER_OUTAGE_INFO = 'WATER_OUTAGE_INFO',
  QUICK_SOLUTION_LIST = 'QUICK_SOLUTION_LIST',
  WORK_ORDER_REPAIR_DETAIL = 'WORK_ORDER_REPAIR_DETAIL',
}
/**
 * DELETE: 关闭指定的tab页
 *
 * ADD: 打开一个指定的tab页，并且打开底部抽屉框，并且将tabs的activeKey切换为当前tab
 *
 * TOGGLE: 将tabs的activeKey切换为当前tab
 *
 * CLEAN: 关闭所有的tab页，并且关闭底部抽屉框
 *
 * CLOSE: 隐藏抽屉框，tab页的状态不变
 *
 * OPEN: 打开一个指定的tab页，并且打开底部抽屉框，但是tabs的activeKey不会切换
 */
export type BottomHandleType =
  | 'DELETE'
  | 'ADD'
  | 'CLEAN'
  | 'TOGGLE'
  | 'CLOSE'
  | 'OPEN';

export interface BaseState {
  loading: boolean;
  dataInitialComplete: boolean;
  siteName: string;
  viewId: string | undefined;
  mouseMode: MouseMode;
  /** string as YYYY-MM-DD，设备更新时间初始必须为undefined */
  deviceUpdateDate: string | undefined;
  activeRightPanel: RightPanelItem | undefined;
  /** 底部抽屉开关 active:activeBottomTab  open: bottomOpen;  */
  bottomOpen: boolean;
  activeBottomTab: BottomTabKey | undefined;
  bottomOpenTabs: BottomTabKey[];
  layoutMainLoading: boolean;
  bagListMap: { [key: string]: GetBagListType };
  lotteryListMap: { [key: string]: GetLotteryListType };
  lotteryLevelList: GetLotteryLevelListType[];
  deliveryList: DeliveryType[];
}
