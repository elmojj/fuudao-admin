'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Tag } from 'antd';
import { useRef } from 'react';
import RarityTag from 'src/components/gacha/RarityTag';
import {
  getGachaDrawLogList,
  type GachaDrawLogRecord,
} from 'src/app/request/gacha-admin';

export default function GachaDrawLogList() {
  const ref = useRef<ActionType>();

  const columns: ProColumns<GachaDrawLogRecord>[] = [
    { title: '时间', dataIndex: 'createdAt', width: 160, search: false },
    { title: '用户', dataIndex: 'nickname', search: false, width: 100 },
    { title: '用户ID', dataIndex: 'userId', copyable: true, ellipsis: true },
    {
      title: '来源',
      dataIndex: 'drawType',
      valueEnum: {
        single: { text: '盲盒机' },
        bag_box: { text: '选格开赏' },
      },
      render: (_, row) =>
        row.drawType === 'bag_box' ? (
          <Tag color="orange">选格</Tag>
        ) : (
          <Tag color="blue">盲盒</Tag>
        ),
    },
    { title: '池/福袋', dataIndex: 'poolId', ellipsis: true },
    { title: '赏品', dataIndex: 'itemName' },
    {
      title: '稀有度',
      dataIndex: 'rarity',
      render: (_, row) => <RarityTag rarity={row.rarity} />,
      valueEnum: { N: 'N', R: 'R', SR: 'SR', SSR: 'SSR', UR: 'UR' },
    },
    { title: '积分', dataIndex: 'scoreGained', search: false, width: 70 },
    {
      title: '重复',
      dataIndex: 'isDuplicate',
      search: false,
      width: 60,
      render: (_, row) => (row.isDuplicate ? '是' : '否'),
    },
    { title: '关键词', dataIndex: 'keyword', hideInTable: true },
  ];

  return (
    <ProTable<GachaDrawLogRecord>
      actionRef={ref}
      rowKey="id"
      headerTitle="抽赏记录"
      request={async (params) => {
        const res = await getGachaDrawLogList(params);
        return { data: res.list, total: res.total, success: res.status === 'Success' };
      }}
      columns={columns}
    />
  );
}
