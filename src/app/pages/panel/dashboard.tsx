'use client';

import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Statistic, Table } from 'antd';
import { useEffect, useState } from 'react';
import { getDashboardStats } from 'src/app/request/gacha-admin';

export default function Dashboard() {
  const [data, setData] = useState<Record<string, any>>({});

  useEffect(() => {
    getDashboardStats().then((res) => {
      if (res.status === 'Success' && res.data) setData(res.data);
    });
  }, []);

  return (
    <PageContainer title="数据概览">
      <Row gutter={16}>
        <Col span={6}>
          <Card><Statistic title="今日抽赏" value={data.todayDraws ?? 0} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="今日新增用户" value={data.todayUsers ?? 0} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="总用户" value={data.totalUsers ?? 0} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="今日 UR" value={data.todayUr ?? 0} /></Card>
        </Col>
      </Row>
      <Card title="排行榜预览" style={{ marginTop: 16 }}>
        <Table
          rowKey={(r: { rankType: string; rank: number; nickname: string }) =>
            `${r.rankType}-${r.rank}-${r.nickname}`}
          pagination={false}
          dataSource={data.rankPreview || []}
          columns={[
            { title: '榜', dataIndex: 'rankType' },
            { title: '周期', dataIndex: 'periodKey' },
            { title: '排名', dataIndex: 'rank', width: 60 },
            { title: '用户', dataIndex: 'nickname' },
            { title: '分数', dataIndex: 'score' },
          ]}
        />
      </Card>
    </PageContainer>
  );
}
