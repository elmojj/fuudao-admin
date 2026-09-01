'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button } from 'antd';
import { useRef } from 'react';
import { useAppNavigate } from 'src/utils/app-navigation';
import { getGachaPoolList, type GachaPoolItem } from 'src/app/request/gacha-admin';
import useAddEditPoolModal from './use-add-edit-pool-modal';

export default function GachaPoolList() {
  const ref = useRef<ActionType>();
  const navigate = useAppNavigate();
  const { contextModal, toEdit } = useAddEditPoolModal({
    callBack: () => ref.current?.reload(),
  });

  const columns: ProColumns<GachaPoolItem>[] = [
    { title: '赏池 ID', dataIndex: 'poolId', copyable: true, width: 120 },
    { title: '名称', dataIndex: 'name' },
    { title: '排序', dataIndex: 'sort', search: false, width: 80 },
    { title: '赏品数', dataIndex: 'itemCount', search: false, width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      valueEnum: { 1: { text: '启用', status: 'Success' }, 0: { text: '禁用', status: 'Default' } },
    },
    { title: '创建时间', dataIndex: 'createdAt', search: false, width: 160 },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      render: (_, row) => [
        <a key="items" onClick={() => navigate(`/gachaManagement/itemList?poolId=${row.poolId}`)}>
          赏品
        </a>,
        <a key="edit" onClick={() => toEdit(row)}>
          编辑
        </a>,
      ],
    },
  ];

  return (
    <>
      <ProTable<GachaPoolItem>
        actionRef={ref}
        rowKey="poolId"
        headerTitle="赏池管理"
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={() => toEdit(undefined)}>
            新建赏池
          </Button>,
        ]}
        request={async (params) => {
          const res = await getGachaPoolList(params);
          return { data: res.list, total: res.total, success: res.status === 'Success' };
        }}
        columns={columns}
      />
      {contextModal}
    </>
  );
}
