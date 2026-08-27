/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import styled from 'styled-components/macro';

export const LayoutMainHeaderWrapper = styled.div`
  display: flex;
  padding: 0 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colorBorderSecondary};
`;

export const LayoutMainContentWrapper = styled.div<{
  hiddenLayout: string | undefined;
}>`
  height: ${(props) => (props.hiddenLayout ? '100vh' : 'calc(100vh - 46px)')};
  overflow-y: auto;
`;
