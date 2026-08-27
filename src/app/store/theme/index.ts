/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { PayloadAction } from '@reduxjs/toolkit';
import {
  ComponentsConfig,
  DefaultSeedToken,
  Theme,
} from 'src/styles/theme/theme';
import { useInjectReducer } from 'src/utils/redux-injectors';
import { createSlice } from 'src/utils/reduxjs/toolkit';
import { getThemeFromLocal } from 'src/utils/tool';
import { ThemeState } from './types';

export const initialState: ThemeState = {
  seedToken: undefined,
  componentsConfig: undefined,
  theme: getThemeFromLocal(),
};

export const slice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    updateTheme(state, action: PayloadAction<{ theme: Theme }>) {
      const { theme } = action.payload;
      state.theme = theme;
    },
    updateSeedToken(
      state,
      action: PayloadAction<{ seedToken?: DefaultSeedToken }>,
    ) {
      const { seedToken } = action.payload;
      state.seedToken = seedToken;
    },
    updateComponentsConfig(
      state,
      action: PayloadAction<{ componentsConfig?: ComponentsConfig }>,
    ) {
      const { componentsConfig } = action.payload;

      return { ...state, componentsConfig };
    },
    resetState() {
      return initialState;
    },
  },
});

export const { actions: themeActions } = slice;

export const useThemeSlice = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
};
