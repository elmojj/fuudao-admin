/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

export interface SystemTaskListItem {
  name: string;
  title: string;
}

export type SystemTaskList = SystemTaskListItem[];

export interface GetSystemTaskParams {
  current: number;
  pageSize: number;
  /** string as YYYY-MM-DD HH:mm:ss */
  startTime: string;
  endTime: string;
  taskStatus?: string;
  taskName?: string;
  taskText?: string;
}

export interface SystemKettleLogItem {
  taskId: string;
  startTime?: string;
  endTime?: string;
  taskName: string;
  taskType: string;
  taskStatus: string;
  retryCount: number;
  /** string as YYYY-MM-DD hh:mm:ss */
  cronTime?: string;
  duration?: string;
}

export type SystemKettleLogList = SystemKettleLogItem[];

export const SYSTEM_TASK_STATUS = [
  {
    label: 'OK',
    value: 'OK',
  },
  {
    label: 'NG',
    value: 'NG',
  },
  {
    label: 'RUN',
    value: 'RUN',
  },
];

export const getDuration = (
  startTime: string | undefined,
  endTime: string | undefined,
): string => {
  if (!startTime || !endTime) return '持续中';
  const durationYears = dayjs.duration(dayjs(endTime).diff(startTime)).years();
  const durationYearsString = durationYears ? `${durationYears}年` : '';
  const durationMonths = dayjs
    .duration(dayjs(endTime).diff(startTime))
    .months();
  const durationMonthsString = durationMonths ? `${durationMonths}月` : '';
  const durationDays = dayjs.duration(dayjs(endTime).diff(startTime)).days();
  const durationDaysString = durationDays ? `${durationDays}天` : '';
  const durationHours = dayjs.duration(dayjs(endTime).diff(startTime)).hours();
  const durationHoursString = durationHours ? `${durationHours}时` : '';
  const durationMinutes = dayjs
    .duration(dayjs(endTime).diff(startTime))
    .minutes();
  const durationMinutesString = durationMinutes ? `${durationMinutes}分` : '';
  const durationSeconds = dayjs
    .duration(dayjs(endTime).diff(startTime))
    .seconds();
  return `${durationYearsString}${durationMonthsString}${durationDaysString}${durationHoursString}${durationMinutesString}${durationSeconds}秒`;
};
