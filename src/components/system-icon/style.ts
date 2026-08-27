/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { DeleteOutlined } from '@ant-design/icons';
import { Card } from 'antd';
import { EllipsisText } from 'src/styles/common-style';
import styled from 'styled-components/macro';

export const SystemIconWrapper = styled.div`
  margin: 20px 20px 0;
`;

export const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 20px 0;
  align-items: center;
`;

export const IconWrapper = styled(Card)`
  .icon-header {
    width: 100%;
    display: flex;
    margin-bottom: 15px;
    > div {
      flex: 1 1 auto;
      ${EllipsisText}
    }
  }
  .image {
    display: block;
    height: 36px;
    background: rgba(238, 238, 238, 0.4);
  }
`;

export const DeleteIconWrapper = styled(DeleteOutlined)`
  color: ${({ theme }) => theme.colorErrorText};
`;
