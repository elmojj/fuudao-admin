/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import dayjs from 'dayjs';

/** 支持将前端规范小驼峰命名变成后端接口规范蛇形 (如 startTime -> start_time )  */
export function camelToSnakeCase(str: string, toUpperCase = false): string {
  const result = str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  return toUpperCase ? result.toUpperCase() : result;
}

/** 支持将后端接口规范蛇形命名变成前端规范小驼峰 (如 start_time -> startTime ) */
export function snakeToCamelCase(str: string): string {
  return str.replace(/(_\w)/g, (letter) => letter[1].toUpperCase());
}

/** 支持批量修改命名方式 (小驼峰 -> 蛇形) */
export function convertObjectKeysToSnakeCase(
  obj?: Record<string, any>,
  toUpperCase = false,
): Record<string, any> {
  if (!obj || typeof obj !== 'object') {
    return {};
  }

  const newObj: Record<string, any> = {};

  Object.keys(obj).forEach((key) => {
    const newKey = camelToSnakeCase(key, toUpperCase);
    newObj[newKey] = obj[key];
  });

  return newObj;
}

/** 支持批量修改命名方式 (蛇形 -> 小驼峰) */
export function convertSnakeCaseKeysToCamelCase<T extends Record<string, any>>(
  obj?: T,
): T | {} {
  if (!obj || typeof obj !== 'object') {
    return {};
  }

  const output: any = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (Object.prototype.toString.call(value) === '[object Object]') {
      output[snakeToCamelCase(key)] = convertSnakeCaseKeysToCamelCase(value);
    } else if (Array.isArray(value)) {
      output[snakeToCamelCase(key)] = value.map((item) => {
        if (typeof item === 'object') {
          return convertSnakeCaseKeysToCamelCase(item);
        }
        return item;
      });
    } else {
      output[snakeToCamelCase(key)] = value;
    }
  });
  return output;
}

/** 对对象中带有 dayjs 的值进行 format 转义，如果键名匹配特定模式，则使用特殊时间格式 */
export function formatDayjsInObject(
  obj: Record<string, any>,
  specialTimeFormat: boolean = false,
): Record<string, any> {
  const isSpecialKey = (key: string): boolean => {
    const specialKeyRegex = /(?:start|end).*time|time.*(?:start|end)/i;
    return specialKeyRegex.test(key);
  };

  return Object.entries(obj).reduce((acc, [key, value]) => {
    let formattedValue;

    if (dayjs.isDayjs(value)) {
      if (specialTimeFormat && isSpecialKey(key)) {
        formattedValue = key.toLowerCase().includes('start')
          ? value.format('YYYY-MM-DD 00:00:00')
          : value.format('YYYY-MM-DD 23:59:59');
      } else {
        formattedValue = value.format('YYYY-MM-DD HH:mm:ss');
      }
    } else if (typeof value === 'object' && value !== null) {
      formattedValue = formatDayjsInObject(value, specialTimeFormat);
    } else {
      formattedValue = value;
    }

    return { ...acc, [key]: formattedValue };
  }, {});
}

export function convertKeyToLowerString(
  obj: Record<string, any>,
): Record<string, any> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    let formattedValue;

    if (typeof value === 'object' && value !== null) {
      formattedValue = convertKeyToLowerString(value);
    } else {
      formattedValue = value;
    }

    return { ...acc, [key.toLowerCase()]: formattedValue };
  }, {});
}

export function isNotNullOrEmpty(value: any): boolean {
  return value !== undefined && value !== null && value !== '';
}
