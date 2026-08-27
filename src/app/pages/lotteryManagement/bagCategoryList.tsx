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
import getBagCategoryList from 'src/app/request/bag-category-list';
import useAddAndEditModal from './use-add-edit-modal';

export type TableListItem = {
  id: string;
  key: number;
  categoryName: string;
  createTime: number;
  updateTime: number;
};

export default function BagCategoryList() {
  const ref = useRef<ActionType>();
  const { contextModal, toEdit } = useAddAndEditModal({
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
    getBagCategoryList(params).then((res) => {
      if (res.status === 'Success') {
        const data: TableListItem[] = res.list.map((item, index) => ({
          key: index,
          id: item.id,
          categoryName: item.categoryName,
          createTime: dayjs(item.createdAt).valueOf(),
          updateTime: dayjs(item.updatedAt).valueOf(),
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
      width: 80,
      search: false,
    },
    {
      title: '类型名称',
      dataIndex: 'categoryName',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 100,
      ellipsis: true,
      search: false,
      render: (_, record) =>
        dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '更新时间	',
      dataIndex: 'updateTime',
      valueType: 'dateTimeRange',
      width: 100,
      ellipsis: true,
      search: false,
      render: (_, record) =>
        dayjs(record.updateTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      width: 150,
      key: 'option',
      valueType: 'option',
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          onClick={() =>
            toEdit({ id: record.id, categoryName: record.categoryName })
          }
        >
          编辑
        </Button>,
        <Button
          key="delete"
          type="link"
          onClick={() => {
            console.log('删除');
          }}
        >
          删除
        </Button>,
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
            创建福袋类型
          </Button>,
        ]}
      />
      {contextModal}
    </>
  );
}
