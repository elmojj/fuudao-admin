/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

export type MapViewName = 'ONLINE' | 'SOLUTION' | 'MINIMAP' | string;
export const MAP_VIEW_NAME_ONLINE: MapViewName = 'ONLINE';
export const MAP_VIEW_NAME_SOLUTION: MapViewName = 'SOLUTION';
export const MAP_VIEW_NAME_MINIMAP: MapViewName = 'MINIMAP';

export type MapViewType = 'ONLINE' | 'SOLUTION' | 'COMPARE' | 'MINIMAP';
export const MAP_VIEW_TYPE_ONLINE: MapViewType = 'ONLINE';
export const MAP_VIEW_TYPE_SOLUTION: MapViewType = 'SOLUTION';
export const MAP_VIEW_TYPE_COMPARE: MapViewType = 'COMPARE';
export const MAP_VIEW_TYPE_MINIMAP: MapViewType = 'MINIMAP';
export const MapViewTypeList: MapViewType[] = [
  MAP_VIEW_TYPE_ONLINE,
  MAP_VIEW_TYPE_SOLUTION,
  MAP_VIEW_TYPE_COMPARE,
  MAP_VIEW_TYPE_MINIMAP,
];
