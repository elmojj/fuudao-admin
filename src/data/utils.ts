/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import dayjs, { Dayjs } from 'dayjs';
import { utils, writeFileXLSX } from 'xlsx';

type TimeRange = [startTime: Dayjs | string, endTime: Dayjs | string];

export type ExcelSheetData = {
  dataSource: Array<{ [index: string]: number | string | undefined | null }>;
  columns: Array<{ title: string; dataIndex: string }>;
  sheetName?: string;
  placeholderWithSheet?: string;
};

export default function toObject(map = new Map()): any {
  if (!(map instanceof Map)) return map;
  return Object.fromEntries(
    Array.from(map.entries(), ([k, v]) => {
      if (v instanceof Array) {
        return [k, v.map(toObject)];
      }
      if (v instanceof Map) {
        return [k, toObject(v)];
      }
      return [k, v];
    }),
  );
}

export function round(number: number, precision?: number): number {
  const p = precision ? 10 ** precision : 1;
  return Math.round(number * p) / p;
}

export const formatNumber = (
  number: string | number | undefined | null,
  precision: number,
): number => {
  const value: number = Number(number);

  if (
    !Object.is(value, NaN) &&
    !Object.is(value, Infinity) &&
    !Object.is(value, -Infinity)
  ) {
    return round(value, precision);
  }
  return 0;
};

/**
 * 判断一个时间点是否在时间段之间
 * @param range
 * @param time
 * @returns
 */
export function isTimeBetween(range: TimeRange, time: Dayjs | string): boolean {
  const [startTime, endTime] = range.map((time) => dayjs(time));
  const dayjsTime = dayjs(time);
  if (dayjsTime.isValid() && startTime.isValid() && endTime.isValid())
    return !dayjsTime.isBefore(startTime) && !dayjsTime.isAfter(endTime);
  return false;
}

/**
 * 比较2个时间段是否存在重合
 * @param range1 比较时间段1
 * @param range2 比较时间段2
 * @returns
 */
export function isTimeRangesOverlap(
  range1: TimeRange,
  range2: TimeRange,
): boolean {
  const [range1Start, range1End] = range1.map((time) => dayjs(time));
  const [range2Start, range2End] = range2.map((time) => dayjs(time));

  return (
    isTimeBetween([range2Start, range2End], range1Start) ||
    isTimeBetween([range2Start, range2End], range1End) ||
    isTimeBetween([range1Start, range1End], range2Start) ||
    isTimeBetween([range1Start, range1End], range2End)
  );
}

export function convertToSpecificDate<T extends string | Dayjs>(
  time: T,
  specificDate: string | Dayjs,
): T {
  const originalTime = dayjs(time);
  const hours = originalTime.hour();
  const minutes = originalTime.minute();
  const seconds = originalTime.second();

  const todayWithOriginalTime = dayjs(specificDate)
    .startOf('day')
    .set('hour', hours)
    .set('minute', minutes)
    .set('second', seconds);

  return (
    typeof time === 'string'
      ? todayWithOriginalTime.format('YYYY-MM-DD HH:mm:ss')
      : todayWithOriginalTime
  ) as T;
}

export function getTimeRangesOverlap(
  range1: TimeRange,
  range2: TimeRange,
): TimeRange | undefined {
  const [range1Start, range1End] = range1.map((time) => dayjs(time));
  const [range2Start, range2End] = range2.map((time) => dayjs(time));

  if (range1End.isBefore(range2Start) || range2End.isBefore(range1Start))
    return undefined;
  const overlapStart = range1Start.isAfter(range2Start)
    ? range1Start
    : range2Start;
  const overlapEnd = range1End.isBefore(range2End) ? range1End : range2End;

  return [overlapStart, overlapEnd];
}

export function compareNumbers(
  a: number | undefined | null,
  b: number | undefined | null,
): number {
  return (a ?? -1) - (b ?? -1);
}

export function exportToExcel(
  dataSource: ExcelSheetData['dataSource'],
  columns: ExcelSheetData['columns'],
  fileName: string,
  sheetName?: ExcelSheetData['sheetName'],
  placeholder?: ExcelSheetData['placeholderWithSheet'],
): void {
  const sheetData = dataSource.map((item) => {
    const newObject: {
      [index: string]: number | string | undefined | null | boolean;
    } = {};
    columns.forEach((column) => {
      const { title, dataIndex } = column;
      newObject[title] = item[dataIndex] ?? placeholder;
    });
    return newObject;
  });

  /* get state data and export to XLSX */
  const ws = utils.json_to_sheet(sheetData);
  const wb = utils.book_new();

  utils.book_append_sheet(wb, ws, sheetName ?? 'Sheet1');
  writeFileXLSX(wb, `${fileName}.xlsx`);
}

export function exportToExcelWithMultipleSheets(
  sheets: Array<ExcelSheetData>,
  fileName: string,
  placeholder?: string,
): void {
  const wb = utils.book_new();
  sheets.forEach((sheet, index) => {
    const { dataSource, columns, sheetName, placeholderWithSheet } = sheet;
    const sheetData = dataSource.map((item) => {
      const newObject: {
        [index: string]: number | string | undefined | null | boolean;
      } = {};
      columns.forEach((column) => {
        const { title, dataIndex } = column;
        newObject[title] =
          item[dataIndex] ?? placeholderWithSheet ?? placeholder;
      });
      return newObject;
    });

    /* get state data and export to XLSX */
    const ws = utils.json_to_sheet(sheetData);
    utils.book_append_sheet(wb, ws, sheetName ?? `Sheet${index + 1}`);
  });
  writeFileXLSX(wb, `${fileName}.xlsx`);
}

export const isBetweenRange = (
  value: number,
  min: number = -Number.MAX_VALUE,
  max: number = Number.MAX_VALUE,
): boolean => {
  if (typeof value !== 'number') return false;
  return value >= min && value <= max;
};
