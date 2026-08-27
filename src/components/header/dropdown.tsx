/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import type { DropDownProps } from 'antd/es/dropdown';
import React from 'react';
import { DropdownWrapper } from './style';

export type HeaderDropdownProps = {
  dropdownRender: React.ReactNode | (() => React.ReactNode) | any;
} & Omit<DropDownProps, 'dropdownRender'>;

const HeaderDropdown: React.FC<HeaderDropdownProps> = ({ ...restProps }) => (
  <DropdownWrapper overlayClassName="header-dropdown" {...restProps} />
);

export default HeaderDropdown;
