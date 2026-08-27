/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

export type HighlightStyleType =
  // 数据库配置
  | 'select'
  | 'measure'
  | 'highlight'
  | 'track'
  | 'valveManageOpenValve'
  | 'valveManageClosedValve'
  | 'valveAnalyseImpactedValve'
  | 'valveAnalyseClosedValve'
  | 'deviceRelation'
  /**
   * @deprecated 属于本地自定义的style key下次重构时，计划删除
   */
  | 'trackSelect'
  /**
   * @deprecated 属于本地自定义的style key下次重构时，计划删除
   */
  | 'pollutedTrackSelect'
  /**
   * @deprecated 属于本地自定义的style key下次重构时，计划删除
   */
  | 'unpollutedTrackSelect'
  /**
   * @deprecated 属于本地自定义的style key下次重构时，计划删除
   */
  | 'custom'
  | 'solutionCreateModified'
  | 'solutionModifyModified'
  | 'refModel';

export const HIGHLIGHT_SELECT: HighlightStyleType = 'select';
export const HIGHLIGHT_MEASURE: HighlightStyleType = 'measure';
export const HIGHLIGHT_DEFAULT: HighlightStyleType = 'highlight';
export const HIGHLIGHT_TRACK: HighlightStyleType = 'track';
export const HIGHLIGHT_VALVE_MANAGE_OPEN: HighlightStyleType =
  'valveManageOpenValve';
export const HIGHLIGHT_VALVE_MANAGE_CLOSED: HighlightStyleType =
  'valveManageClosedValve';
export const HIGHLIGHT_VALVE_ANALYSIS_IMPACTED: HighlightStyleType =
  'valveAnalyseImpactedValve';
export const HIGHLIGHT_VALVE_ANALYSIS_CLOSED: HighlightStyleType =
  'valveAnalyseClosedValve';
export const DEVICE_RELATION: HighlightStyleType = 'deviceRelation';
/**
 * @deprecated 属于本地自定义的style key下次重构时，计划删除
 */
export const HIGHLIGHT_TRACK_SELECT: HighlightStyleType = 'trackSelect';
/**
 * @deprecated 属于本地自定义的style key下次重构时，计划删除
 */
export const HIGHLIGHT_POLLUTED_TRACK_SELECT: HighlightStyleType =
  'pollutedTrackSelect';
/**
 * @deprecated 属于本地自定义的style key下次重构时，计划删除
 */
export const HIGHLIGHT_UNPOLLUTED_TRACK_SELECT: HighlightStyleType =
  'unpollutedTrackSelect';
/**
 * @deprecated 属于本地自定义的style key下次重构时，计划删除
 */
export const HIGHLIGHT_CUSTOM: HighlightStyleType = 'custom';
export const HIGHLIGHT_REF_MODEL: HighlightStyleType = 'refModel';

export interface StyleConfig {
  pointColor: string;
  lineColor: string;
  polygonColor: string;
  fontSize: number;
  lineWidth?: number;
  polygonStrokeColor?: string;
}

export type HighlightStyle = Map<HighlightStyleType, StyleConfig>;

export function getHighlightStyle(
  highlightStyleConfig: Record<HighlightStyleType, StyleConfig>,
): HighlightStyle {
  return new Map(
    Object.entries(highlightStyleConfig) as [HighlightStyleType, StyleConfig][],
  );
}

export const getSelectColor = (highlightStyleType: HighlightStyleType) => {
  switch (highlightStyleType) {
    case HIGHLIGHT_SELECT:
      return '#ff0000';
    case HIGHLIGHT_POLLUTED_TRACK_SELECT:
      return '#31bf20';
    case HIGHLIGHT_UNPOLLUTED_TRACK_SELECT:
      return '#24a2df';
    default:
      return '#ff0000';
  }
};
