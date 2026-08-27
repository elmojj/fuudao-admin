/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { ThemeConfig, theme } from 'antd';
import { MappingAlgorithm } from 'antd/es/theme';
import {
  AliasToken,
  SeedToken as AntdSeedToken,
  MapToken,
} from 'antd/es/theme/interface';

export type DefaultSeedToken = Partial<AntdSeedToken>;

export type ComponentsConfig = ThemeConfig['components'];

export type DefaultMapToken = Partial<MapToken>;

export type Theme = 'light' | 'dark';

export interface ThemeToken extends Partial<AliasToken> {}

const { defaultAlgorithm, defaultSeed: antdDefaultSeed, darkAlgorithm } = theme;

export const defaultSeed: DefaultSeedToken = {};

export const seedToken: AntdSeedToken = { ...antdDefaultSeed, ...defaultSeed };

export const defaultToken: MapToken = defaultAlgorithm(seedToken);

export const getAlgorithm = (
  theme: Theme,
): MappingAlgorithm | MappingAlgorithm[] => {
  if (theme === 'dark') return darkAlgorithm;
  return defaultAlgorithm;
};
