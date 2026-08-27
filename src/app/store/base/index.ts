/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { PayloadAction } from '@reduxjs/toolkit';
import { uniq } from 'lodash';
import { GetBagListType } from 'src/app/request/bag-list';
import { DeliveryType } from 'src/app/request/logistic-list';
import {
  GetLotteryLevelListType,
  GetLotteryListType,
} from 'src/app/request/lottery-list';
import { MapViewName } from 'src/data/const/map';
import {
  MouseMode,
  RIGHT_PANEL_PROPERTY,
  RightPanelItem,
} from 'src/data/ui-types';
import { Theme } from 'src/styles/theme/theme';
import { useInjectReducer, useInjectSaga } from 'src/utils/redux-injectors';
import { createSlice } from 'src/utils/reduxjs/toolkit';
import { baseSaga } from './saga';
import { BaseState, BottomHandleType, BottomTabKey } from './types';

export const initialState: BaseState = {
  loading: false,
  dataInitialComplete: false,
  siteName: '慧水科技WaterDesk-Live',
  viewId: undefined,
  mouseMode: 'SELECT',
  deviceUpdateDate: undefined,
  activeRightPanel: undefined,
  activeBottomTab: undefined,
  bottomOpenTabs: [],
  bottomOpen: false,
  layoutMainLoading: true,
  bagListMap: {},
  lotteryListMap: {},
  lotteryLevelList: [],
  deliveryList: [],
};

export const slice = createSlice({
  name: 'base',
  initialState,
  reducers: {
    updateBagMap(
      state,
      action: PayloadAction<{
        bagListMap: { [key: string]: GetBagListType };
      }>,
    ) {
      const { bagListMap } = action.payload;
      state.bagListMap = bagListMap;
    },
    updateLotteryMap(
      state,
      action: PayloadAction<{
        lotteryListMap: { [key: string]: GetLotteryListType };
      }>,
    ) {
      const { lotteryListMap } = action.payload;
      state.lotteryListMap = lotteryListMap;
    },
    updateLotteryLevelList(
      state,
      action: PayloadAction<{
        lotteryLevelList: GetLotteryLevelListType[];
      }>,
    ) {
      const { lotteryLevelList } = action.payload;
      state.lotteryLevelList = lotteryLevelList;
    },
    updateDeliveryList(
      state,
      action: PayloadAction<{
        deliveryList: DeliveryType[];
      }>,
    ) {
      const { deliveryList } = action.payload;
      state.deliveryList = deliveryList;
    },
    updateViewId(state, action: PayloadAction<{ viewId: string | undefined }>) {
      const { viewId } = action.payload;
      state.viewId = viewId;
    },
    updateMouseMode(state, action: PayloadAction<{ mouseMode: MouseMode }>) {
      const { mouseMode } = action.payload;
      state.mouseMode = mouseMode;
    },
    initializeOnLineDataBase(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      state,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      actions: PayloadAction<{
        /** date: YYYY-MM-DD */
        theme: Theme;
        sectionId: MapViewName;
      }>,
    ) {},

    updateDeviceUpdateDate(state, action: PayloadAction<{ date: string }>) {
      const { date } = action.payload;
      state.deviceUpdateDate = date;
    },
    updateActiveRightPanel(
      state,
      action: PayloadAction<{ activePanel: RightPanelItem | undefined }>,
    ) {
      const { activePanel } = action.payload;
      if (state.activeRightPanel === activePanel) {
        state.activeRightPanel = undefined;
      } else {
        state.activeRightPanel = activePanel;
      }
    },
    trySwitchToPropertyPalette(state) {
      if (
        state.activeRightPanel !== undefined &&
        state.activeRightPanel !== RIGHT_PANEL_PROPERTY
      ) {
        state.activeRightPanel = RIGHT_PANEL_PROPERTY;
      }
    },
    updateBottomTab(
      state,
      action: PayloadAction<{
        activeKey?: BottomTabKey;
        type: BottomHandleType;
      }>,
    ) {
      const { activeKey, type } = action.payload;
      const newBottomOpenTabs = state.bottomOpenTabs.filter(
        (tabKey) => tabKey !== activeKey,
      );
      switch (type) {
        case 'ADD':
          if (typeof activeKey === 'undefined') break;
          state.bottomOpenTabs = uniq([...state.bottomOpenTabs, activeKey]);
          state.activeBottomTab = activeKey;
          state.bottomOpen = true;
          break;
        case 'DELETE':
          state.bottomOpenTabs = newBottomOpenTabs;
          // set default activeKey
          state.activeBottomTab =
            newBottomOpenTabs[newBottomOpenTabs.length - 1];
          // should close？
          state.bottomOpen = newBottomOpenTabs.length > 0;
          break;
        case 'CLEAN':
          state.bottomOpenTabs = [];
          state.activeBottomTab = undefined;
          state.bottomOpen = false;
          break;
        case 'TOGGLE':
          state.activeBottomTab = activeKey;
          break;
        case 'CLOSE':
          state.bottomOpen = false;
          break;
        case 'OPEN':
          if (typeof activeKey === 'undefined') break;
          state.bottomOpenTabs = uniq([...state.bottomOpenTabs, activeKey]);
          state.bottomOpen = true;
          break;
        default:
          break;
      }
    },

    resetState(state) {
      return {
        ...initialState,
        dataInitialComplete: state.dataInitialComplete,
        layoutMainLoading: state.layoutMainLoading,
      };
    },
    resetStateSaga() {},
    signOutResetSaga() {},
    propertyTrackAction(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      state,
    ) {},

    updateStartLoading(state) {
      state.loading = true;
      state.dataInitialComplete = false;
    },
    updateEndLoading(state) {
      state.loading = false;
      state.dataInitialComplete = true;
    },
    updateDataInitialComplete(state) {
      state.dataInitialComplete = true;
    },

    initializeDeviceAndIndicatorSaga() {},

    updateScheduleShift() {},

    updateLayoutMainLoading(
      state,
      action: PayloadAction<{
        loading: boolean;
      }>,
    ) {
      const { loading } = action.payload;
      state.layoutMainLoading = loading;
    },
    initializeLayoutMainSaga() {},
  },
});

export const { actions: baseActions } = slice;

export const useBaseSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: baseSaga });
  return { actions: slice.actions };
};
