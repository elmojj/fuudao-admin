'use client';

import type {
  ActionType,
  ParamsType,
  ProColumns,
} from '@ant-design/pro-components';
import { ProTable, TableDropdown } from '@ant-design/pro-components';
import { Button, Typography } from 'antd';
import dayjs from 'dayjs';
import { useRef } from 'react';
import { useAppNavigate } from 'src/utils/app-navigation';
import getBagList from 'src/app/request/bag-list';

export type TableListItem = {
  key: number;
  id: string;
  packageName: string;
  cover: string;
  sharePhoto: string;
  categoryName: string;
  price: number;
  totalPackage: number;
  saleCount: number;
  activeTime: [number, number];
  createTime: number;
  updateTime: number;
  startTime: number;
  endTime: number;

  limitBuy: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
};

const getTimeStateText = (timeRange: [number, number], status: boolean) => {
  if (!status) {
    return '禁用';
  }
  const currentTime = dayjs();
  if (currentTime.isAfter(dayjs(timeRange[1]))) {
    return <Typography.Text type="danger">已过期</Typography.Text>;
  }
  if (currentTime.isBefore(dayjs(timeRange[0]))) {
    return <Typography.Text>未开始</Typography.Text>;
  }
  return <Typography.Text type="success">进行中</Typography.Text>;
};

export default function BagList() {
  const navigate = useAppNavigate();
  const ref = useRef<ActionType>();

  const getTableData = (
    params: ParamsType & {
      pageSize?: number | undefined;
      current?: number | undefined;
      keyword?: string | undefined;
    },
  ) =>
    // 表单搜索项会从 params 传入，传递给后端接口。
    getBagList(params).then((res) => {
      if (res.status === 'Success') {
        const data: TableListItem[] = res.list.map((item, index) => ({
          key: index,
          id: item.id,
          packageName: item.packageName,
          cover: item.cover,
          sharePhoto: item.sharePhoto,
          categoryName: item.categoryName,
          categoryId: item.categoryId,
          price: Number(item.price),
          totalPackage: Number(item.totalPackage),
          saleCount: 0,
          activeTime: [
            dayjs(item.startTime).valueOf(),
            dayjs(item.endTime).valueOf(),
          ],
          createTime: dayjs(item.createdAt).valueOf(),
          updateTime: dayjs(item.updatedAt).valueOf(),
          startTime: dayjs(item.startTime).valueOf(),
          endTime: dayjs(item.endTime).valueOf(),
          limitBuy: item.limitBuy,
          status: item.status,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));

        return {
          data,
          total: res.total,
        };
      }
      return {
        data: [],
      };
    });

  const columns: ProColumns<TableListItem>[] = [
    {
      title: '排序',
      dataIndex: 'index',
      valueType: 'indexBorder',
      search: false,
      width: 80,
    },
    {
      title: '福袋ID',
      dataIndex: 'id',
      width: 100,
    },
    {
      title: '福袋名称',
      dataIndex: 'packageName',
      width: 100,
    },
    {
      title: '福袋图',
      dataIndex: 'cover',
      valueType: 'image',
      align: 'center',
      search: false,
      width: 100,
    },
    {
      title: '福袋分类',
      dataIndex: 'categoryName',
      width: 100,
    },
    {
      title: '定价',
      dataIndex: 'price',
      search: false,
      width: 100,
    },
    {
      title: '总数',
      dataIndex: 'totalPackage',
      search: false,
      width: 100,
    },
    {
      title: '已售',
      dataIndex: 'saleCount',
      search: false,
      width: 100,
    },
    {
      title: '剩余',
      dataIndex: 'saleCount',
      search: false,
      width: 100,
      render: (_, record) => record.totalPackage - record.saleCount,
    },
    {
      title: '已售成本',
      dataIndex: 'cost',
      search: false,
      width: 100,
    },
    {
      title: '已售总金额(实收)',
      dataIndex: 'saleMoney',
      search: false,
      width: 100,
      ellipsis: true,
      render: (_, record) => record.saleCount * record.price,
    },
    {
      title: '活动时间',
      dataIndex: 'activeTime',
      valueType: 'dateTimeRange',
      width: 100,
      ellipsis: true,
      render: (_, record) =>
        `${dayjs(record.startTime).format('YYYY-MM-DD HH:mm:ss')} - ${dayjs(
          record.endTime,
        ).format('YYYY-MM-DD HH:mm:ss')}`,
    },
    {
      title: '状态',
      dataIndex: 'activeTimeState',
      width: 100,
      ellipsis: true,
      render: (_, record) => getTimeStateText(record.activeTime, record.status),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 100,
      search: false,
      ellipsis: true,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      search: false,
      width: 100,
      ellipsis: true,
    },
    {
      title: '备注',
      dataIndex: 'memo',
      ellipsis: true,
      copyable: true,
      search: false,
      width: 150,
    },
    {
      title: '操作',
      width: 150,
      key: 'option',
      valueType: 'option',
      render: (_, record) => [
        <Button
          key="link"
          onClick={() => {
            navigate('/lotteryManagement/createBag', {
              state: { record },
            });
          }}
        >
          编辑
        </Button>,
        <Button
          key="copyNewOne"
          onClick={() => {
            navigate('/lotteryManagement/createBag', {
              state: { record, copyNewOne: true },
            });
          }}
        >
          复制
        </Button>,
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a key="link2">{!record.status ? '启用' : '禁用'}</a>,
        <TableDropdown
          key="actionGroup"
          menus={[
            { key: 'copy', name: '复制' },
            { key: 'delete', name: '删除' },
          ]}
        />,
      ],
    },
  ];

  return (
    <ProTable<TableListItem>
      actionRef={ref}
      defaultSize="small"
      bordered
      columns={columns}
      request={getTableData}
      rowKey="key"
      pagination={{
        showQuickJumper: true,
      }}
      scroll={{ x: 760 }}
      search={{
        defaultCollapsed: false,
      }}
      dateFormatter="string"
      toolBarRender={() => [
        <Button
          type="primary"
          key="primary"
          onClick={() => navigate('/lotteryManagement/createBag')}
        >
          创建福袋
        </Button>,
      ]}
    />
  );
}
