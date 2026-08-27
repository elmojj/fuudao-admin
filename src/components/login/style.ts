/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { AppMode } from 'src/data/app-config';
import styled from 'styled-components';

// eslint-disable-next-line import/prefer-default-export
export const LoginWrapper = styled.div<{ appMode?: AppMode }>`
  background-repeat: no-repeat;
  background-size: cover;
  height: 100vh;
  width: 100%;
  .login-content {
    width: 330px;
    min-width: 330px;
    max-width: 500px;
    margin: 0 auto;
    padding-top: 10vh;
  }
  .logo {
    width: 100%;
    display: flex;
    justify-content: center;
    height: 70px;
  }
  .login-subtitle {
    margin-block-start: 12px;
    margin-block-end: 40px;
    font-size: 22px;
    text-align: center;
    font-weight: bold;
    min-height: 33px;
  }
`;
