/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { DatePicker as AntdDatePicker, DatePickerProps } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

type Props = {
  value?: Dayjs | string | null | undefined;
  valueFormat?: string;
  onChange?: (value: Dayjs | string | null) => void;
} & DatePickerProps;

const DatePicker = ({
  valueFormat,
  value,
  onChange,
  ...datePickerProps
}: Props) => {
  const handleOnChange: DatePickerProps['onChange'] = (date) => {
    const value = valueFormat && date ? date.format(valueFormat) : date;
    onChange?.(value);
  };

  const dateValue = value ? dayjs(value) : value;

  return (
    <AntdDatePicker
      style={{ width: '100%' }}
      {...datePickerProps}
      value={dateValue}
      onChange={handleOnChange}
    />
  );
};

export default DatePicker;
