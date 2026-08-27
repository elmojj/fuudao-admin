/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { DatePicker, DatePickerProps, Radio, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import useMergedState from 'rc-util/es/hooks/useMergedState';
import { useState } from 'react';
import useToken from 'src/styles/use-token';

export enum DatePickerType {
  DATE = 'date',
  MONTH = 'month',
  YEAR = 'year',
}

export interface MultiDateValue {
  dates: string[];
  dateType: DatePickerType;
}

interface Props {
  value?: MultiDateValue;
  mode?: DatePickerType;
  datePickProps?: Omit<DatePickerProps, 'picker'>;
  onChange?: (data: MultiDateValue) => void;
}

export default function MultipleDatePicker(props: Props) {
  const { value, mode, datePickProps, onChange } = props;

  const { token } = useToken();

  const [open, setOpen] = useState<boolean>(false);
  const [selectedDates, setSelectedDates] = useMergedState<MultiDateValue>(
    {
      dates: [],
      dateType: DatePickerType.DATE,
    },
    { value },
  );

  const [datePickerType, setDatePickerType] = useMergedState<DatePickerType>(
    DatePickerType.DATE,
    {
      value: mode,
    },
  );

  const onChangeDatePickerType = (changeValue: DatePickerType) => {
    setDatePickerType(changeValue);
    if (changeValue === DatePickerType.DATE) {
      const dates = {
        dates: [
          dayjs().format('YYYY-MM-DD'),
          dayjs().add(-1, 'day').format('YYYY-MM-DD'),
          dayjs().add(-2, 'day').format('YYYY-MM-DD'),
        ],
        dateType: changeValue,
      };
      setSelectedDates(dates);
      onChange?.(dates);
    } else if (changeValue === DatePickerType.MONTH) {
      const dates = {
        dates: [dayjs().format('YYYY-MM')],
        dateType: changeValue,
      };
      setSelectedDates(dates);
      onChange?.(dates);
    }
  };

  const dateCellRender: DatePickerProps['cellRender'] = (current, info) => {
    const style: React.CSSProperties = {};
    if (typeof current === 'number' || typeof current === 'string')
      return (
        <div className="ant-picker-cell-inner" style={style}>
          {current}
        </div>
      );
    let date = current.date();
    let format = 'YYYY-MM-DD';
    if (info.type === DatePickerType.MONTH) {
      format = 'YYYY-MM';
      date = current.month() + 1;
    }
    if (selectedDates?.dates.includes(current.format(format))) {
      style.border = `1px solid ${token.colorPrimary}`;
      style.borderRadius = '5px';
    }
    return (
      <div className="ant-picker-cell-inner" style={style}>
        {date}
      </div>
    );
  };

  const handleSelectedDates = (date: string | string[]) => {
    const dateString = typeof date === 'string' ? date : date[0];
    if (!dateString) return;
    const dates = [...selectedDates.dates];
    if (dates?.includes(dateString)) {
      const index = dates.indexOf(dateString);
      dates.splice(index, 1);
    } else {
      dates?.push(dateString);
    }
    onChange?.({
      dates,
      dateType: datePickerType,
    });
    setSelectedDates({
      dates,
      dateType: datePickerType,
    });
  };

  const renderExtraFooter = () => {
    const dates = [...selectedDates.dates];
    return (
      <Space
        style={{ width: '100%', padding: '4px', lineHeight: 'normal' }}
        wrap
        size={4}
      >
        {dates.map((date: string) => (
          <Tag
            style={{ margin: 0 }}
            key={date}
            closable
            onClose={() => handleSelectedDates(date)}
          >
            {date}
          </Tag>
        ))}
      </Space>
    );
  };

  const getDatePicker = (type: DatePickerType) => {
    switch (type) {
      case DatePickerType.MONTH:
        return (
          <DatePicker
            {...datePickProps}
            allowClear={false}
            picker="month"
            open={open}
            cellRender={dateCellRender}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onChange={(_, value) => handleSelectedDates(value)}
            renderExtraFooter={renderExtraFooter}
          />
        );

      case DatePickerType.YEAR:
        return (
          <DatePicker {...datePickProps} allowClear={false} picker="year" />
        );

      case DatePickerType.DATE:
      default:
        return (
          <DatePicker
            {...datePickProps}
            allowClear={false}
            open={open}
            cellRender={dateCellRender}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onChange={(_, value) => handleSelectedDates(value)}
            showToday={false}
            renderExtraFooter={renderExtraFooter}
          />
        );
    }
  };

  return (
    <Space wrap>
      {getDatePicker(datePickerType)}
      <Radio.Group
        value={datePickerType}
        onChange={(e) => onChangeDatePickerType(e.target.value)}
      >
        <Radio key={DatePickerType.DATE} value={DatePickerType.DATE}>
          日
        </Radio>
        <Radio key={DatePickerType.MONTH} value={DatePickerType.MONTH}>
          月
        </Radio>
      </Radio.Group>
    </Space>
  );
}
