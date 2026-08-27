/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

export type RightPanelItem =
  | 'SIMPLE_SETTING'
  | 'SETTING'
  | 'PROPERTY'
  | 'LEGEND';

export const RIGHT_PANEL_SETTING: RightPanelItem = 'SETTING';
export const RIGHT_PANEL_SIMPLE_SETTING: RightPanelItem = 'SIMPLE_SETTING';
export const RIGHT_PANEL_PROPERTY: RightPanelItem = 'PROPERTY';
export const RIGHT_PANEL_LEGEND: RightPanelItem = 'LEGEND';

export type MouseMode =
  | 'SELECT'
  | 'MEASURE_LINESTRING'
  | 'MEASURE_POLYGON'
  | 'EDIT_ADDJUNCTION'
  | 'EDIT_ADDPIPE'
  | 'EDIT_DELETEPIPE'
  | 'MOUSE_EDIT_ADDSINGLEPIPE'
  | 'MEASURE_BOX';
export const MOUSE_SELECT: MouseMode = 'SELECT';
export const MOUSE_MEASURE_LINESTRING: MouseMode = 'MEASURE_LINESTRING';
export const MOUSE_MEASURE_POLYGON: MouseMode = 'MEASURE_POLYGON';
export const MOUSE_MEASURE_BOX: MouseMode = 'MEASURE_BOX';
export const MOUSE_EDIT_ADDJUNCTION: MouseMode = 'EDIT_ADDJUNCTION';
export const MOUSE_EDIT_ADDPIPE: MouseMode = 'EDIT_ADDPIPE';
export const MOUSE_EDIT_DELETEPIPE: MouseMode = 'EDIT_DELETEPIPE';
export const MOUSE_EDIT_ADDSINGLEPIPE: MouseMode = 'MOUSE_EDIT_ADDSINGLEPIPE';
