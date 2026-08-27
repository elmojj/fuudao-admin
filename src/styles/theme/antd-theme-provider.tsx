/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.
*/

'use client';

import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useThemeSlice } from 'src/app/store/theme';
import {
  selectComponentsConfig,
  selectSeedToken,
  selectTheme,
} from 'src/app/store/theme/selector';
import { getAlgorithm, seedToken } from './theme';

type Props = {
  children?: React.ReactNode;
};

export const AntdThemeProvider = (props: Props) => {
  useThemeSlice();
  const themeType = useSelector(selectTheme);
  const systemSeedToken = useSelector(selectSeedToken);
  const componentsConfig = useSelector(selectComponentsConfig);
  const { children } = props;

  const theme = useMemo(
    () => ({
      token: { ...seedToken, ...systemSeedToken },
      components: componentsConfig,
      algorithm: getAlgorithm(themeType),
    }),
    [themeType, systemSeedToken, componentsConfig],
  );

  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      {children}
    </ConfigProvider>
  );
};
