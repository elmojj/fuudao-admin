'use client';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { useEffect } from 'react';
import { useBaseSlice } from 'src/app/store/base';
import { GlobalStyle } from 'src/styles/global-style';
import { AntdThemeProvider } from 'src/styles/theme/antd-theme-provider';
import { StyledThemeProvider } from 'src/styles/theme/styled-theme-provider';
import StoreProvider from './store-provider';

dayjs.locale('zh-cn');

function AppProvidersInner({ children }: { children: React.ReactNode }) {
  useBaseSlice();

  useEffect(() => {
    document.body.classList.add('fontLoaded');
  }, []);

  return (
    <AntdThemeProvider>
      <StyledThemeProvider>
        {children}
        <GlobalStyle />
      </StyledThemeProvider>
    </AntdThemeProvider>
  );
}

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProvider>
      <AntdRegistry>
        <AppProvidersInner>{children}</AppProvidersInner>
      </AntdRegistry>
    </StoreProvider>
  );
}
