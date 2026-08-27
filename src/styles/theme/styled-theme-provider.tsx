/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.
*/

'use client';

import { ThemeProvider as OriginalThemeProvider } from 'styled-components';
import { theme as antdTheme } from 'antd';

const { useToken: useAntdToken } = antdTheme;

export const StyledThemeProvider = (props: { children?: React.ReactNode }) => {
  const { token: antdToken } = useAntdToken();
  const { children } = props;

  return (
    <OriginalThemeProvider theme={antdToken}>{children}</OriginalThemeProvider>
  );
};
