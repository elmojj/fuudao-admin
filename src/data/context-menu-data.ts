/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { MapViewName } from './const/map';
import { SidebarMenuType } from './sidebar-menu-data';

export type ContextMenuItem = {
  id: SidebarMenuType;
  /** 支持的地图类型 */
  supportedViews: MapViewName[];
  /** 是否为分隔符 */
  separator?: boolean;
  /** 菜单项名称 */
  title?: string;
  children?: ContextMenuItem[];
};
