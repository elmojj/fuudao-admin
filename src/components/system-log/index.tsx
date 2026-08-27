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
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Space,
  Table,
} from 'antd';
import { ColumnsType } from 'antd/es/table/interface';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import {
  GetSystemLogParams,
  SYSTEM_OPERATION_TYPE,
  SystemLogDataItem,
} from 'src/data/system-log';
import { tablePaginationConfig } from '../common/pagination';
import { SystemLogWrapper } from './style';

const { RangePicker } = DatePicker;

const options = SYSTEM_OPERATION_TYPE;

interface Page {
  page: number;
  pageSize: number;
}

interface FormValues {
  rangeTime?: [Dayjs, Dayjs];
  keyWord?: string;
  operationType?: string;
}

interface Props {
  total: number;
  data: SystemLogDataItem[];
  loading: boolean;
  getData: (params: GetSystemLogParams) => void;
}

const SystemLog = (props: Props) => {
  const { data, loading, getData, total } = props;
  const [form] = Form.useForm();
  const [page, setPage] = useState<Page>({
    page: 1,
    pageSize: 10,
  });

  const columns: ColumnsType<SystemLogDataItem> = [
    {
      title: '应用名称',
      key: 'applicationName',
      dataIndex: 'applicationName',
    },
    {
      title: '用户名称',
      key: 'userName',
      dataIndex: 'userName',
    },
    {
      title: '操作时间',
      key: 'operationTime',
      dataIndex: 'operationTime',
      render: (text) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : ''),
    },
    {
      title: '操作类型',
      key: 'operationType',
      dataIndex: 'operationType',
      render: (text: string) =>
        options.find((item) => item.value === text)?.label ?? text,
    },
    {
      title: '来源',
      key: 'sourceDesc',
      dataIndex: 'sourceDesc',
    },
    {
      title: '地址ip',
      key: 'addressId',
      dataIndex: 'addressId',
    },
    {
      title: '操作描述',
      key: 'operationDesc',
      dataIndex: 'operationDesc',
    },
  ];

  const getParams = (): GetSystemLogParams => {
    const values: FormValues = form.getFieldsValue();
    const { rangeTime, keyWord, operationType } = values;
    const startDate = rangeTime ? rangeTime[0].format('YYYY-MM-DD') : undefined;
    const endDate = rangeTime ? rangeTime[1].format('YYYY-MM-DD') : undefined;
    return {
      ...page,
      startDate,
      endDate,
      keyWord,
      operationType,
    };
  };

  const onFinish = () => {
    const params = getParams();
    getData(params);
  };

  const onReset = () => {
    getData(page);
  };

  useEffect(() => {
    const params = getParams();
    getData(params);
  }, [page]);

  return (
    <SystemLogWrapper>
      <Form
        form={form}
        style={{ margin: '20px ' }}
        name="loginLogForm"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        onFinish={onFinish}
        onReset={onReset}
        autoComplete="off"
      >
        <Row gutter={20}>
          <Col span={6}>
            <Form.Item label="操作时间" name="rangeTime">
              <RangePicker />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="关键字查询" name="keyWord">
              <Input placeholder="请输入关键字" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="操作类型" name="operationType">
              <Select
                allowClear
                options={options}
                placeholder="请选择操作类型"
              />
            </Form.Item>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Form.Item wrapperCol={{ span: 24 }}>
              <Space>
                <Button type="default" htmlType="reset">
                  重置
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  查询
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
      <Table
        rowKey="recordId"
        loading={loading}
        columns={columns}
        dataSource={data ?? []}
        pagination={{
          ...tablePaginationConfig,
          total,
          pageSize: page.pageSize,
          onChange: (page: number, pageSize: number) =>
            setPage({
              page,
              pageSize,
            }),
        }}
      />
    </SystemLogWrapper>
  );
};

SystemLog.displayName = 'SystemLog';
export default SystemLog;
