'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { useRef } from 'react';
import { getGachaScoreLogList } from 'src/app/request/gacha-admin';

export default function GachaScoreLogList() {
  const ref = useRef<ActionType>();
  const columns: ProColumns[] = [
    { title: '时间', dataIndex: 'createdAt', search: false },
    { title: '用户', dataIndex: 'nickname', search: false },
    { title: '变动', dataIndex: 'delta', search: false },
    { title: '余额', dataIndex: 'balance', search: false },
    { title: '来源', dataIndex: 'source' },
    { title: '关联', dataIndex: 'refId', search: false, ellipsis: true },
  ];
  return (
    <ProTable
      actionRef={ref}
      rowKey="id"
      headerTitle="积分流水"
      request={async (params) => {
        const res = await getGachaScoreLogList(params);
        return { data: res.list, total: res.total, success: res.status === 'Success' };
      }}
      columns={columns}
    />
  );
}
