'use client';

import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { useRef } from 'react';
import { getGachaRankSnapshotList } from 'src/app/request/gacha-admin';

export default function GachaRankSnapshotList() {
  const ref = useRef<ActionType>();
  const columns: ProColumns[] = [
    {
      title: '榜类型',
      dataIndex: 'rankType',
      valueEnum: { active: '活跃榜', lucky: '欧气榜', score: '积分榜' },
    },
    { title: '周期', dataIndex: 'periodKey' },
    { title: '排名', dataIndex: 'rank', search: false, width: 60 },
    { title: '用户', dataIndex: 'nickname', search: false },
    { title: '分数', dataIndex: 'score', search: false },
    { title: '快照时间', dataIndex: 'snapshotAt', search: false },
  ];
  return (
    <ProTable
      actionRef={ref}
      rowKey="id"
      headerTitle="排行榜快照"
      request={async (params) => {
        const res = await getGachaRankSnapshotList(params);
        return { data: res.list, total: res.total, success: res.status === 'Success' };
      }}
      columns={columns}
    />
  );
}
