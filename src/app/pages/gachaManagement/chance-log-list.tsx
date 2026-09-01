'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { useRef } from 'react';
import { getGachaChanceLogList } from 'src/app/request/gacha-admin';

export default function GachaChanceLogList() {
  const ref = useRef<ActionType>();
  const columns: ProColumns[] = [
    { title: '时间', dataIndex: 'createdAt', search: false },
    { title: '用户', dataIndex: 'nickname', search: false },
    { title: '用户ID', dataIndex: 'userId', copyable: true },
    { title: '变动', dataIndex: 'delta', search: false },
    { title: '余额', dataIndex: 'balance', search: false },
    { title: '来源', dataIndex: 'source' },
  ];
  return (
    <ProTable
      actionRef={ref}
      rowKey="id"
      headerTitle="次数流水"
      request={async (params) => {
        const res = await getGachaChanceLogList(params);
        return { data: res.list, total: res.total, success: res.status === 'Success' };
      }}
      columns={columns}
    />
  );
}
