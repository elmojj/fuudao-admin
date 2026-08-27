/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { SidebarMenuItem } from './sidebar-menu-data';
import { HighlightStyle } from './style-config';

export interface FuZhouRoadQueryArgs {
  url?: string;
  timeout?: number;
  method?: string;
  params?: {};
  where?: string;
}

export interface TimePeriod {
  label: string;
  startTime: string;
  endTime: string;
}

export enum AppMode {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
}

export const defaultTimePeriods: TimePeriod[] = [
  {
    label: '早高峰',
    startTime: '7:00',
    endTime: '9:00',
  },
  {
    label: '晚高峰',
    startTime: '18:00',
    endTime: '21:00',
  },
  {
    label: '平时',
    startTime: '12:00',
    endTime: '15:00',
  },
  {
    label: '夜间',
    startTime: '1:00',
    endTime: '4:00',
  },
  {
    label: '自定义',
    startTime: '0:00',
    endTime: '24:00',
  },
];

export interface AssessmentFormItem {
  field: string;
  fieldName: string;
  description: string;
  multiple: boolean;
  enable: boolean;
  initialValues: Array<string>;
  index: number;
}

export interface AccessmentParams {
  otypeList: string[];
  vpropList: string[];
}

export type MeanAbsoluteErrorValue = [number, number | undefined][];

/** 左开右闭 */
export type MeanAbsoluteError = {
  type?: 'includeFactory' | 'excludeFactory';
  enableStandard?: boolean;
  indicatorType: 'SDVAL_CR' | 'SDVAL_FLOW_W' | 'SDVAL_PRESS_W';
  value: MeanAbsoluteErrorValue;
  ratio: number[];
  summaryOthers?: boolean;
};

export type AssessmentScoreItem = {
  vprop: string;
  title?: string;
  helpDescription?: string;
  dateformat?: string;
};

export type AssessmentDevice = {
  dataSource: {
    otypeList: string[];
    vpropList: string[];
  };
  formConfig: Map<string, AssessmentFormItem>;
  score: AssessmentScoreItem[];
  help?: string;
};

export type AssessmentSimulation = {
  meanAbsoluteError: MeanAbsoluteError[];
  formConfig: Map<string, AssessmentFormItem>;
  formula: string;
  score: AssessmentScoreItem[];
  helpConfig?: { [key: string]: string };
};
export enum GisRoadQueryType {
  SH_CHENGTOU = 'chengtou',
  FUZHOU = 'fuzhou',
}

export interface ChenTouRoadQueryArgs {
  url?: string;
  timeout?: number;
  method?: string;
  params?: {};
}

export type GisRoadQueryConfig = FuZhouRoadQueryArgs | ChenTouRoadQueryArgs;

export type GisRoadConfig = {
  type: GisRoadQueryType;
  config: GisRoadQueryConfig;
};

export interface PumpStateColor {
  closed: string;
  variable: string;
  fixed: string;
}

export interface TimelineConfig {
  showEvent: boolean;
}

export enum ContextMenuType {
  ValveAnalysis = 'valveAnalysis',
  BurstPipeFlushing = 'burstPipeFlushing',
  SchedulingAnalysis = 'schedulingAnalysis',
  Down = 'down',
  Up = 'up',
  Pollution = 'pollution',
  Custom = 'custom',
}

export interface IssueReportConfig {
  issueType?: Array<{ label: string; value: string }>;
}

export function getContextMenuName(type: ContextMenuType): string {
  switch (type) {
    case ContextMenuType.ValveAnalysis:
      return '关阀分析';
    case ContextMenuType.BurstPipeFlushing:
      return '爆管冲洗';
    case ContextMenuType.SchedulingAnalysis:
      return '综合调度';
    case ContextMenuType.Down:
      return '去向追踪';
    case ContextMenuType.Up:
      return '来源追踪';
    case ContextMenuType.Pollution:
      return '污染溯源';
    case ContextMenuType.Custom:
      return '自定义追踪';
    default:
      return '';
  }
}

export interface AppConfig {
  mapZoomFactor: number;
  mapProjection: string;
  animateZoomLevel: number;
  proj4Register: any;
  highlightStyle: HighlightStyle;
  gisRoadConfig?: GisRoadConfig;
  scadaDownloadConfig: string[];
  docPath: string | undefined;
  timePeriods: TimePeriod[];
  /** number as minutes, default: 5; 需要闪烁的通知警告查询的条件:当前时间((时间轴当前时刻 - x分钟) ~ 时间轴当前时刻) */
  blinkNoticeWarnQueryDuration: number;
  pumpStateColor: PumpStateColor;
  sidebarMenu: SidebarMenuItem[];
  showPredict: boolean;
  showWeatherForecast: boolean;
  assessmentDevice: AssessmentDevice;
  assessmentSimulation: AssessmentSimulation;
  progressStep: number;
  transformEPSG: string;
  timelineConfig?: TimelineConfig | undefined;
  plantAndPumpStationTreeFilter?: string[];
  issueReportConfig: IssueReportConfig;
  enableHighlightRefModel: boolean;
}

export function parseTimePeriods(data: any): TimePeriod[] | undefined {
  if (!Array.isArray(data)) return undefined;
  const timePeriods: TimePeriod[] = [];
  data.forEach((item) => {
    const { label, period } = item;
    if (period.length === 2) {
      timePeriods.push({ label, startTime: period[0], endTime: period[1] });
    }
  });

  return timePeriods;
}
