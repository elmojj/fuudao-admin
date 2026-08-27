/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { createSelector } from '@reduxjs/toolkit';
import { initialState } from '.';
import { RootState } from '../root-state';

const selectSlice = (state: RootState) => state?.base ?? initialState;

export const selectBase = createSelector([selectSlice], (state) => state);

export const selectLoading = createSelector(
  [selectSlice],
  (state) => state.loading,
);

export const selectDataInitialComplete = createSelector(
  [selectSlice],
  (state) => state.dataInitialComplete,
);

export const selectSiteName = createSelector(
  [selectSlice],
  (state) => state.siteName,
);

export const selectViewId = createSelector(
  [selectSlice],
  (state) => state.viewId,
);

export const selectMouseMode = createSelector(
  [selectSlice],
  (state) => state.mouseMode,
);

export const selectDeviceUpdateDate = createSelector(
  [selectSlice],
  (state) => state.deviceUpdateDate,
);

export const selectActiveRightPanel = createSelector(
  [selectSlice],
  (state) => state.activeRightPanel,
);

export const selectBottomOpenTabs = createSelector(
  [selectSlice],
  (state) => state.bottomOpenTabs,
);

export const selectActiveBottomTab = createSelector(
  [selectSlice],
  (state) => state.activeBottomTab,
);

export const selectBottomOpen = createSelector(
  [selectSlice],
  (state) => state.bottomOpen,
);

export const selectLayoutMainLoading = createSelector(
  [selectSlice],
  (state) => state.layoutMainLoading,
);

export const selectBagListMap = createSelector(
  [selectSlice],
  (state) => state.bagListMap,
);

export const selectLotteryListMap = createSelector(
  [selectSlice],
  (state) => state.lotteryListMap,
);

export const selectLotteryLevelList = createSelector(
  [selectSlice],
  (state) => state.lotteryLevelList,
);

export const selectDeliveryList = createSelector(
  [selectSlice],
  (state) => state.deliveryList,
);
