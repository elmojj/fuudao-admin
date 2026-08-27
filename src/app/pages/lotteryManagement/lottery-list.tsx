'use client';

import type {
  ActionType,
  ParamsType,
  ProColumns,
} from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button } from 'antd';
import dayjs from 'dayjs';
import { useRef } from 'react';
import getLotteryList from 'src/app/request/lottery-list';
import useAddAndEditLotteryModal from './use-add-edit-lottery-modal';

export type TableListItem = {
  key: Number;
  id: string;
  productName: string;
  productCode: string;
  productPhoto: string;
  price: string;
  stockpileCount: string;
  status: Number;
  createTime: string;
  updateTime: string;
  stockpileSaleTotal: string;
};

export default function LotteryList() {
  const ref = useRef<ActionType>();
  const { contextModal, toEdit } = useAddAndEditLotteryModal({
    callBack: () => ref.current?.reload(),
  });
  const getTableData = (
    params: ParamsType & {
      pageSize?: number | undefined;
      current?: number | undefined;
      keyword?: string | undefined;
    },
  ) =>
    // 表单搜索项会从 params 传入，传递给后端接口。
    getLotteryList(params).then((res) => {
      if (res.status === 'Success') {
        console.log(res.list);

        const data: TableListItem[] = res.list.map((item, index) => ({
          key: index,
          id: item.id,
          productName: item.productName,
          productCode: item.productCode,
          productPhoto: item.productPhoto,
          price: item.price,
          stockpileCount: item.stockpileCount,
          status: item.status,
          createTime: dayjs(Number(`${item.createTime}000`)).format(
            'YYYY-MM-DD HH:mm:ss',
          ),
          updateTime: dayjs(Number(`${item.updateTime}000`)).format(
            'YYYY-MM-DD HH:mm:ss',
          ),
          stockpileSaleTotal: item.stockpileSaleTotal,
        }));

        return {
          data,
          total: res.total,
        };
      }
      return {
        data: [],
        total: 0,
      };
    });

  const columns: ProColumns<TableListItem>[] = [
    {
      title: '赏品ID',
      dataIndex: 'productCode',
      valueType: 'indexBorder',
      search: false,
      width: 80,
    },
    {
      title: '赏品名称',
      dataIndex: 'productName',
      width: 100,
    },
    {
      title: '赏品图',
      dataIndex: 'productPhoto',
      key: 'productPhoto',
      valueType: 'image',
      align: 'center',
      search: false,
      width: 100,
    },
    {
      title: '单价成本',
      dataIndex: 'price',
      search: false,
      width: 100,
    },
    {
      title: '已售',
      dataIndex: 'stockpileCount',
      search: false,
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 100,
      ellipsis: true,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      search: false,
      width: 100,
      ellipsis: true,
    },
    {
      title: '操作',
      width: 150,
      key: 'option',
      valueType: 'option',
      render: (_, record) => [
        <Button key="edit" onClick={() => toEdit(record)}>
          新增
        </Button>,
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a key="link2">禁用</a>,
      ],
    },
  ];

  return (
    <>
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
            onClick={() => toEdit(undefined)}
          >
            新增
          </Button>,
        ]}
      />
      {contextModal}
    </>
  );
}
