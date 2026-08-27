/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/
import { Form } from 'antd';
import styled from 'styled-components/macro';

export const ResizableHandle = styled.span`
  position: absolute;
  right: -5px;
  bottom: 0;
  z-index: 1;
  width: 10px;
  height: 100%;
  cursor: col-resize;
`;

export const FormSearchWrapper = styled(Form)<{ isProTable: boolean }>`
  padding: ${({ isProTable }) => (isProTable ? '0 24px' : '')};
`;

export const RightButtonWrapper = styled.div`
  text-align: right;
`;
