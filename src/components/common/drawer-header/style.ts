/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { EllipsisText } from 'src/styles/common-style';
import styled from 'styled-components/macro';

// eslint-disable-next-line import/prefer-default-export
export const HeaderWrapper = styled.div`
  display: flex;
  flex: 0;
  align-items: center;
  padding: 8px 4px;
  font-size: 16px;
  line-height: 1.5;
  border-bottom: 1px solid ${({ theme }) => theme.colorBorder};
  background: transparent;
  position: sticky;
  top: 0;
  z-index: 1;
  background: ${({ theme }) => theme.colorBgElevated};
  .drawer-header-title {
    ${EllipsisText}
    flex: auto;
    margin: 0;
    font-weight: 600;
    font-size: 16px;
    line-height: 1.5;
  }
  .drawer-header-sub-title {
    flex: auto;
    margin-left: 10px;
    font-size: 12px;
    line-height: 1.5;
  }
  .drawer-header-extra-content {
    flex: none;
  }
`;
