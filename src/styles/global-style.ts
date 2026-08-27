/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import 'antd/dist/reset.css';
import { createGlobalStyle } from 'styled-components';
import './icon-font.css';

// eslint-disable-next-line import/prefer-default-export
export const GlobalStyle = createGlobalStyle`
  html,
  body {
    height: 100%;
    width: 100%;
    line-height: 1.5;
    color: ${({ theme }) => theme.colorText};
  }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    background-color: ${({ theme }) => theme.colorBgContainer};
  }
  body.fontLoaded {
    font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  p,
  label {
    line-height: 1.5em;
  }
  input, select, button {
    font-family: inherit;
    font-size: inherit;
  }
  .icon {
    width: 1.5rem;
    height: 1.5rem;
  }
  .app-logo {
      opacity: .4;
      position: fixed;
      bottom: 5px;
      right: 35px;
      width: 150px;
      height: 20px;
      z-index: 9999999;
  }

  .header-dropdown {
    width: 344px;
    background-color: ${({ theme }) => theme.colorBgElevated};
    border-radius: 4px;
    box-shadow: ${({ theme }) => theme.boxShadowSecondary};
  }

  .blink-warn-popover {
    width: 177px;
    max-width: 177px;
    .ant-popover-inner .ant-popover-title {
      min-width: auto;
    }
  }

  .ol-ctx-menu-container{
    background-color: ${({ theme }) => theme.colorBgContainer};
    color: ${({ theme }) => theme.colorTextBase};
  }

  .ol-ctx-menu-container li.ol-ctx-menu-separator hr {
    background-color: ${({ theme }) => theme.colorTextBase};
    background-image: none;
  }

  .ol-ctx-menu-container li:not(.ol-ctx-menu-separator):hover {
    color: ${({ theme }) => theme.colorText};
    background-color: ${({ theme }) => theme.colorBgTextActive};
  }
  * {
    scrollbar-width: auto;
    scrollbar-color: auto;
  }

/* 整个滚动条 */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

/* 滚动条上的滚动滑块 水平/垂直滚动条的样式*/
::-webkit-scrollbar-thumb:horizontal {
  width: 4px;
  background-color: #ccc;
  border-radius: 6px;
  -webkit-border-radius: 6px;
}

::-webkit-scrollbar-thumb:vertical {
  height: 50px;
  background-color: #999;
  border-radius: 4px;
  -webkit-border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  cursor: pointer;
  height: 50px;
  background-color: #9f9f9f;
  border-radius: 4px;
  -webkit-border-radius: 4px;
}

/* 滚动条没有滑块的轨道部分 */
::-webkit-scrollbar-track-piece {
  background-color: ${({ theme }) => theme.colorBgContainer};
  border-radius: 0;
  -webkit-border-radius: 0;
}

/* 当同时有垂直滚动条和水平滚动条时交汇的部分 */
::-webkit-scrollbar-corner{
  background-color: ${({ theme }) => theme.colorBgBase};
}
`;
