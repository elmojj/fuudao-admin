/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../root-state';
import { initialState } from '.';

const selectSlice = (state: RootState) => state?.theme || initialState;

export const selectTheme = createSelector(
  [selectSlice],
  (state) => state.theme,
);

export const selectSeedToken = createSelector(
  [selectSlice],
  (state) => state.seedToken,
);

export const selectComponentsConfig = createSelector(
  [selectSlice],
  (state) => state.componentsConfig,
);
