'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Popconfirm, message } from 'antd';
import { useRef } from 'react';
import { useAppLocation } from 'src/utils/app-navigation';
import RarityTag from 'src/components/gacha/RarityTag';
import {
  deleteGachaItem,
  getGachaItemList,
  type GachaItemRecord,
} from 'src/app/request/gacha-admin';
import useAddEditGachaItemModal from './use-add-edit-gacha-item-modal';

export default function GachaItemList() {
  const ref = useRef<ActionType>();
  const { search } = useAppLocation();
  const poolId = new URLSearchParams(search).get('poolId') || undefined;

  const { contextModal, toEdit } = useAddEditGachaItemModal({
    callBack: () => ref.current?.reload(),
    defaultPoolId: poolId,
  });

  const columns: ProColumns<GachaItemRecord>[] = [
    { title: 'ID', dataIndex: 'itemId', width: 100, copyable: true },
    { title: '名称', dataIndex: 'name' },
    {
      title: '稀有度',
      dataIndex: 'rarity',
      render: (_, row) => <RarityTag rarity={row.rarity} />,
      valueEnum: { N: 'N', R: 'R', SR: 'SR', SSR: 'SSR', UR: 'UR' },
    },
    { title: '欧气', dataIndex: 'rarityScore', search: false, width: 60 },
    { title: '积分', dataIndex: 'scoreValue', search: false, width: 60 },
    { title: '套系', dataIndex: 'series', search: false },
    { title: '权重', dataIndex: 'dropWeight', search: false, width: 70 },
    {
      title: '公示概率%',
      dataIndex: 'dropRate',
      search: false,
      width: 90,
      render: (_, row) => `${row.dropRate ?? 0}%`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      valueEnum: { 1: { text: '上架', status: 'Success' }, 0: { text: '下架', status: 'Default' } },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, row) => [
        <a key="edit" onClick={() => toEdit(row)}>编辑</a>,
        <Popconfirm
          key="del"
          title="确认下架？"
          onConfirm={async () => {
            const res = await deleteGachaItem(row.itemId);
            if (res.status === 'Success') {
              message.success('已下架');
              ref.current?.reload();
            } else message.error(res.errorMessage);
          }}
        >
          <a>下架</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<GachaItemRecord>
        actionRef={ref}
        rowKey="itemId"
        headerTitle={poolId ? `赏品管理 · ${poolId}` : '赏品管理'}
        params={{ poolId }}
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={() => toEdit(undefined)}>
            新建赏品
          </Button>,
        ]}
        request={async (params) => {
          const res = await getGachaItemList({ ...params, poolId: params.poolId || poolId });
          return { data: res.list, total: res.total, success: res.status === 'Success' };
        }}
        columns={columns}
      />
      {contextModal}
    </>
  );
}
