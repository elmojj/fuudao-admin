/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import dayjs from 'dayjs';

// double | enum | time | range
export type UnitType = 'D' | 'E' | 'T' | 'R';

export interface UnitFormat {
  unitName: string | undefined;
  unitType: UnitType | undefined;
  unitTitle: string | undefined;
  unitSymbol: string | undefined;
  valueTitle: string | undefined;
  valueMultiply: number;
  valueAdd: number;
  valuePrecision: number;
  isValid: boolean;

  getValue(value: number | string): number | string | undefined;
  getValueWithSymbol(value: number | string): string;
  getYAxisValues(): string[] | number[];
  getValues(): Array<[string, Array<number>]>;
  getOriginalValue(value: number | string): number | string | undefined;
}

export class DoubleUnitFormat implements UnitFormat {
  unitName: string | undefined;

  unitType: UnitType | undefined;

  unitTitle: string | undefined;

  unitSymbol: string | undefined;

  valueTitle: string | undefined;

  valueMultiply: number = 1;

  valueAdd: number = 0;

  valuePrecision: number = 0;

  yAxisValues: string[] | number[] = [];

  isValid: boolean;

  constructor(name: string, data: any) {
    this.unitName = name;
    this.unitType = 'D';
    this.isValid = this.initialize(data);
    if (!this.isValid)
      console.warn(`unit initialization failed: ${JSON.stringify(data)}`);
  }

  // eslint-disable-next-line class-methods-use-this
  getYAxisValues(): string[] | number[] {
    return [];
  }

  // eslint-disable-next-line class-methods-use-this
  getValues(): Array<[string, Array<number>]> {
    return [];
  }

  private initialize(data: any): boolean {
    if (
      typeof data.value_add !== 'number' ||
      typeof data.value_muli !== 'number' ||
      typeof data.value_precision !== 'number'
    )
      return false;

    this.unitTitle = data.unit_title;
    this.valueAdd = data.value_add;
    this.valueMultiply = data.value_muli;
    this.valuePrecision = data.value_precision;
    this.valueTitle = data.value_title;
    this.unitSymbol = data.value_title;
    return true;
  }

  getValue(value: number | string): number | string | undefined {
    const numberValue = DoubleUnitFormat.getNumberValue(value);
    if (numberValue === undefined) return undefined;

    let newValue = numberValue * this.valueMultiply;
    newValue += this.valueAdd;
    const precision = this.valuePrecision ? 10 ** this.valuePrecision : 1;
    newValue = Math.round(newValue * precision) / precision;
    return newValue;
  }

  getExactValue(value: number | string): number | string | undefined {
    const numberValue = DoubleUnitFormat.getNumberValue(value);
    if (numberValue === undefined) return undefined;

    let newValue = numberValue * this.valueMultiply;
    newValue += this.valueAdd;
    return newValue;
  }

  getOriginalValue(value: number): number {
    let newValue = value - this.valueAdd;
    if (this.valueMultiply === 0) return newValue;
    newValue /= this.valueMultiply;
    const precision = this.valuePrecision ? 10 ** this.valuePrecision : 1;
    return Math.round(newValue * precision) / precision;
  }

  private static getNumberValue(value: number | string): number | undefined {
    if (typeof value === 'number') {
      return value;
    }

    if (value === '') {
      return undefined;
    }

    const newValue = Number(value);
    if (Number.isNaN(newValue)) {
      return undefined;
    }

    return newValue;
  }

  getValueWithSymbol(value: number | string): string {
    const newValue = this.getValue(value);
    let newValueText = '-';
    if (newValue !== undefined) {
      newValueText = `${newValue}`;
    }
    if (this.valueTitle) return `${newValueText} ${this.valueTitle}`;
    return `${newValueText}`;
  }
}

class EnumUnitFormat implements UnitFormat {
  unitName: string | undefined;

  unitType: UnitType | undefined;

  unitTitle: string | undefined;

  unitSymbol: string | undefined;

  valueTitle: string | undefined;

  valueMultiply: number = 1;

  valueAdd: number = 0;

  valuePrecision: number = 0;

  isValid: boolean;

  values: Map<string, string> = new Map<string, string>();

  yAxisValues: string[] = [];

  constructor(name: string, data: any) {
    this.unitName = name;
    this.unitType = 'E';
    this.isValid = this.initialize(data);
    if (!this.isValid)
      console.warn(`unit initialization failed: ${JSON.stringify(data)}`);
  }

  getYAxisValues(): string[] | number[] {
    return this.yAxisValues;
  }

  // eslint-disable-next-line class-methods-use-this
  getValues(): Array<[string, Array<number>]> {
    return [];
  }

  private initialize(data: any): boolean {
    if (typeof data.value_title !== 'string') return false;

    try {
      this.unitTitle = data.unit_title;
      this.valueTitle = data.value_title;
      const ruleJson = JSON.parse(data.value_title);
      this.values = new Map(Object.entries(ruleJson));
      this.yAxisValues = Object.keys(ruleJson);
      return true;
    } catch (error) {
      let message = 'unknown error';
      if (error instanceof Error) message = error.message;
      console.warn('EnumUnitFormat initialization failed:', message);
      return false;
    }
  }

  getValue(value: number | string): number | string | undefined {
    return this.values.get(`${value}`);
  }

  getValueWithSymbol(value: number | string): string {
    const newValue = this.getValue(value);
    if (newValue === undefined) return '-';

    return `${newValue}`;
  }

  getOriginalValue(value: number | string): number | string | undefined {
    return this.getValue(value);
  }
}

class TimeUnitFormat implements UnitFormat {
  unitName: string | undefined;

  unitType: UnitType | undefined;

  unitTitle: string | undefined;

  unitSymbol: string | undefined;

  valueTitle: string | undefined;

  valueMultiply: number = 1;

  valueAdd: number = 0;

  valuePrecision: number = 0;

  isValid: boolean;

  constructor(name: string, data: any) {
    this.unitName = name;
    this.unitType = 'T';
    this.isValid = this.initialize(data);
    if (!this.isValid)
      console.warn(`unit initialized failed: ${JSON.stringify(data)}`);
  }

  // eslint-disable-next-line class-methods-use-this
  getYAxisValues(): string[] | number[] {
    return [];
  }

  // eslint-disable-next-line class-methods-use-this
  getValues(): Array<[string, Array<number>]> {
    return [];
  }

  private initialize(data: any): boolean {
    if (typeof data.value_title !== 'string' || data.value_title === '')
      return false;

    this.unitTitle = data.unit_title;
    this.valueTitle = data.value_title;
    return true;
  }

  getValue(value: number | string): number | string | undefined {
    if (typeof value !== 'string') return undefined;
    return dayjs(value).format(this.valueTitle);
  }

  getValueWithSymbol(value: number | string): string {
    const newValue = this.getValue(value);
    if (newValue === undefined) return '-';

    return `${newValue}`;
  }

  getOriginalValue(value: number | string): number | string | undefined {
    return this.getValue(value);
  }
}

class RangeUnitFormat implements UnitFormat {
  unitName: string | undefined;

  unitType: UnitType | undefined;

  unitTitle: string | undefined;

  unitSymbol: string | undefined;

  valueTitle: string | undefined;

  valueMultiply: number = 1;

  valueAdd: number = 0;

  valuePrecision: number = 0;

  yAxisValues: number[] = [];

  isValid: boolean;

  values: Array<[string, Array<number>]> = [];

  constructor(name: string, data: any) {
    this.unitName = name;
    this.unitType = 'R';
    this.isValid = this.initialize(data);
    if (!this.isValid)
      console.warn(`unit initialized failed: ${JSON.stringify(data)}`);
  }

  getYAxisValues(): string[] | number[] {
    return this.yAxisValues;
  }

  // eslint-disable-next-line class-methods-use-this
  getValues(): Array<[string, Array<number>]> {
    return this.values;
  }

  private initialize(data: any): boolean {
    if (typeof data.value_title !== 'string' || data.value_title === '')
      return false;

    try {
      this.unitTitle = data.unit_title;
      this.valueTitle = data.value_title;
      const rules: any[] = JSON.parse(data.value_title);
      if (rules.length <= 1) return false;
      for (let i: number = 0; i < rules.length; i += 1) {
        const key: string = Object.keys(rules[i])[0];
        const rangeValues: number[] = rules[i][key];
        if (i === 0 || i === rules.length - 1) {
          if (rangeValues.length !== 1) {
            return false;
          }
        } else if (rangeValues.length !== 2) {
          return false;
        }

        this.values.push([key, rangeValues]);
        if (i !== 0) this.yAxisValues.push(rangeValues[0]);
      }

      return true;
    } catch (error) {
      let message = 'unknown error';
      if (error instanceof Error) message = error.message;
      console.warn('RangeUnitFormat initialization failed:', message);
      return false;
    }
  }

  getValue(value: number | string): number | string | undefined {
    let numberValue: number | undefined;
    if (value === '') return undefined;
    if (typeof value === 'number') numberValue = value;
    else numberValue = Number(value);
    if (Number.isNaN(numberValue)) return undefined;

    let foundKey: string | undefined;
    for (let i: number = 0; i < this.values.length; i += 1) {
      const [key, range] = this.values[i];
      if (i === 0) {
        if (numberValue < range[0]) {
          foundKey = key;
          break;
        }
      } else if (i < this.values.length - 1) {
        if (numberValue >= range[0] && numberValue < range[1]) {
          foundKey = key;
          break;
        }
      } else if (numberValue >= range[0]) {
        foundKey = key;
        break;
      }
    }

    return foundKey;
  }

  getValueWithSymbol(value: number | string): string {
    const newValue = this.getValue(value);
    if (newValue === undefined) return '-';

    return `${newValue}`;
  }

  getOriginalValue(value: number | string): number | string | undefined {
    return this.getValue(value);
  }
}

export function generateUnitFormat(name: string, data: any): UnitFormat | null {
  if (typeof data.unit_type !== 'string') return null;
  switch (data.unit_type) {
    case 'D':
    case '':
      return new DoubleUnitFormat(name, data);
    case 'E':
      return new EnumUnitFormat(name, data);
    case 'T':
      return new TimeUnitFormat(name, data);
    case 'R':
      return new RangeUnitFormat(name, data);
    default:
      return null;
  }
}

class SystemUnits {
  static getInstance(): SystemUnits {
    if (SystemUnits._instance == null) {
      SystemUnits._instance = new SystemUnits();
    }
    return SystemUnits._instance;
  }

  // eslint-disable-next-line no-use-before-define
  private static _instance: SystemUnits;

  private units: Map<string, UnitFormat>;

  private constructor() {
    this.units = new Map<string, UnitFormat>();
  }

  registerUnits(unitsJson: any) {
    this.units.clear();
    Object.entries(unitsJson).forEach((entry) => {
      const unitFormat = generateUnitFormat(entry[0], entry[1]);
      if (unitFormat != null && unitFormat.isValid) {
        this.units.set(entry[0], unitFormat);
      }
    });
  }

  getUnitFormat(key: string): UnitFormat | undefined {
    return this.units.get(key);
  }
}

export function registerSystemUnits(unitsJson: any) {
  SystemUnits.getInstance().registerUnits(unitsJson);
}

export function getUnitFormat(key: string): UnitFormat | undefined {
  return SystemUnits.getInstance().getUnitFormat(key);
}

export function getUnitValue(
  key: string,
  value: number | string,
): number | string | undefined {
  const unitFormat: UnitFormat | undefined = getUnitFormat(key);
  if (unitFormat === undefined) {
    return value;
  }

  return unitFormat.getValue(value);
}

export function getUnitValueWithSymbol(
  key: string,
  value: number | string | undefined | null,
): string {
  if (value === undefined || value === null) {
    return '-';
  }
  const unitFormat: UnitFormat | undefined = getUnitFormat(key);
  if (unitFormat === undefined) {
    return value.toString();
  }
  return unitFormat.getValueWithSymbol(value);
}

export function getUnitValues(
  key: string,
): Array<[string, Array<number>]> | undefined {
  const unitFormat: UnitFormat | undefined = getUnitFormat(key);
  if (unitFormat === undefined) {
    return undefined;
  }
  return unitFormat.getValues();
}

export function getHeadUnitFormat(): UnitFormat {
  const data = {
    unit_title: '水头',
    unit_type: 'D',
    value_add: 0,
    value_muli: 1,
    value_precision: 1,
    value_title: 'm',
  };

  return new DoubleUnitFormat('HEAD_M', data);
}

export function getFlowUnitFormat(): UnitFormat {
  const data = {
    unit_title: '流量',
    value_title: 'm³/h',
    unit_type: 'D',
    value_muli: 1,
    value_add: 0,
    value_precision: 1,
  };

  return new DoubleUnitFormat('FLOW', data);
}
