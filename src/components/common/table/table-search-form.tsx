/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import {
  Button,
  Col,
  Form,
  FormInstance,
  Input,
  Row,
  Select,
  SelectProps,
  Space,
  TimeRangePickerProps,
  TreeSelect,
  TreeSelectProps,
} from 'antd';
import { FC } from 'react';
import DatePicker from '../date/date-picker';
import { FormSearchWrapper, RightButtonWrapper } from './style';

export interface SearchItemConfig {
  type:
    | 'input'
    | 'select'
    | 'multiSelect'
    | 'date'
    | 'dateRange'
    | 'treeSelect';
  name: string | string[];
  label: string;
  hidden?: boolean;
  initialValue?: any;
  selectProps?: SelectProps;
  timeRangeProps?: TimeRangePickerProps;
  treeSelectProps?: TreeSelectProps;
  disabled?: boolean;
}

interface HSTableSearchFormProps {
  form: FormInstance;
  name: string;
  loading: boolean;
  onSubmit: () => void;
  onReset: () => void;
  items: SearchItemConfig[];
  initialValues?: Record<string, any>;
  disabled?: boolean;
  span?: number;
  isProTable?: boolean;
  onExport?: () => void;
}

const HSTableSearchForm: FC<HSTableSearchFormProps> = ({
  form,
  name,
  loading,
  onSubmit,
  onReset,
  items,
  initialValues,
  disabled,
  span,
  isProTable,
  onExport,
}) => {
  const renderItem = (item: SearchItemConfig) => {
    let fieldComponent: React.ReactElement | null = null;

    switch (item?.type) {
      case 'input':
        fieldComponent = (
          <Input placeholder={`请输入${item.label}`} disabled={item.disabled} />
        );
        break;
      case 'select':
        fieldComponent = (
          <Select
            allowClear
            placeholder={`请选择${item.label}`}
            disabled={item.disabled}
            {...item.selectProps}
          />
        );
        break;
      case 'multiSelect':
        fieldComponent = (
          <Select
            mode="multiple"
            allowClear
            placeholder={`请选择${item.label}`}
            disabled={item.disabled}
            {...item.selectProps}
          />
        );
        break;
      case 'dateRange':
        fieldComponent = (
          <>
            <Form.Item name={item.name[0]} noStyle>
              <DatePicker
                style={{ width: '48%', minWidth: '120px' }}
                disabled={item.disabled}
                disabledDate={(currentDate) =>
                  form.getFieldValue(item.name[1])
                    ? currentDate.isAfter(
                        form.getFieldValue(item.name[1]),
                        'day',
                      )
                    : false
                }
              />
            </Form.Item>
            -
            <Form.Item name={item.name[1]} noStyle>
              <DatePicker
                style={{ width: '48%', minWidth: '120px' }}
                disabled={item.disabled}
                disabledDate={(currentDate) =>
                  form.getFieldValue(item.name[0])
                    ? currentDate.isBefore(
                        form.getFieldValue(item.name[0]),
                        'day',
                      )
                    : false
                }
              />
            </Form.Item>
          </>
        );
        break;
      case 'treeSelect':
        fieldComponent = (
          <TreeSelect
            allowClear
            disabled={item.disabled}
            placeholder={`请选择${item.label}`}
            {...item.treeSelectProps}
          />
        );
        break;
      default:
        return null;
    }

    return (
      <Form.Item
        label={item.label}
        name={Array.isArray(item.name) ? undefined : item.name}
        hidden={item.hidden}
        initialValue={item.initialValue}
      >
        {fieldComponent}
      </Form.Item>
    );
  };

  const submitButtons = (
    <Space size="small">
      <Button
        type="primary"
        htmlType="submit"
        loading={loading}
        disabled={disabled}
      >
        查询
      </Button>
      <Button type="default" htmlType="reset" disabled={disabled}>
        重置
      </Button>
      {onExport && <Button onClick={onExport}>导出</Button>}
    </Space>
  );

  const getFields = () => {
    const children = [];
    const rowCapacity = 24 / (span ?? 6);
    const itemCount = items.length;
    const fillLastRow = itemCount % rowCapacity;

    for (let i = 0; i < itemCount; i += 1) {
      children.push(
        <Col span={span ?? 6} key={i}>
          {renderItem(items[i])}
        </Col>,
      );
    }

    const needNewRowForButtons = fillLastRow + 1 > rowCapacity;
    const buttonSpan = needNewRowForButtons
      ? 24
      : 24 - fillLastRow * (span ?? 6);

    if (needNewRowForButtons) {
      children.push(
        <Col span={24} key="buttons">
          <RightButtonWrapper>{submitButtons}</RightButtonWrapper>
        </Col>,
      );
    } else {
      children.push(
        <Col span={buttonSpan} key="buttons" style={{ textAlign: 'right' }}>
          {submitButtons}
        </Col>,
      );
    }

    return children;
  };

  return (
    <FormSearchWrapper
      form={form}
      name={name}
      onFinish={onSubmit}
      onReset={onReset}
      autoComplete="off"
      initialValues={initialValues}
      isProTable={isProTable ?? false}
    >
      <Row gutter={24} align="middle">
        {getFields()}
      </Row>
    </FormSearchWrapper>
  );
};

export default HSTableSearchForm;
