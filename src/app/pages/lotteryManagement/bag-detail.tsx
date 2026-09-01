'use client';

import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Card, Col, Descriptions, Row, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useAppLocation } from 'src/utils/app-navigation';
import { getBagBoxStateAdmin } from 'src/app/request/gacha-admin';

type BoxCell = {
  boxNo: number;
  status: 'sold' | 'locked' | 'available';
  lockUser?: string;
};

export default function BagDetail() {
  const { search } = useAppLocation();
  const bagId = new URLSearchParams(search).get('id') || '';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!bagId) return;
    setLoading(true);
    getBagBoxStateAdmin(bagId).then((res) => {
      if (res.status === 'Success') setData(res.data);
      setLoading(false);
    });
  }, [bagId]);

  const total = data?.bag?.totalPackage || 0;
  const soldSet = new Set<number>(data?.state?.soldBoxes || []);
  const lockMap = new Map<number, string>();
  (data?.state?.locks || []).forEach((l: any) => {
    lockMap.set(l.boxNo, l.userName || l.userId);
  });

  const cells: BoxCell[] = [];
  for (let i = 1; i <= total; i++) {
    if (soldSet.has(i)) cells.push({ boxNo: i, status: 'sold' });
    else if (lockMap.has(i))
      cells.push({ boxNo: i, status: 'locked', lockUser: lockMap.get(i) });
    else cells.push({ boxNo: i, status: 'available' });
  }

  const colorMap = {
    sold: '#d9d9d9',
    locked: '#fff7e6',
    available: '#f6ffed',
  };

  return (
    <PageContainer
      loading={loading}
      title={data?.bag?.packageName || '福袋详情'}
      subTitle={bagId}
    >
      {data?.bag && (
        <Descriptions column={4} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="定价">¥{data.bag.price}</Descriptions.Item>
          <Descriptions.Item label="总格数">{data.bag.totalPackage}</Descriptions.Item>
          <Descriptions.Item label="已售">{soldSet.size}</Descriptions.Item>
          <Descriptions.Item label="状态">
            {data.bag.status ? <Tag color="green">进行中</Tag> : <Tag>已结束</Tag>}
          </Descriptions.Item>
        </Descriptions>
      )}

      <Row gutter={16}>
        <Col span={14}>
          <Card title="格子状态" size="small">
            <Typography.Paragraph type="secondary">
              灰=已售 · 黄=锁定 · 绿=可选
            </Typography.Paragraph>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {cells.map((cell) => (
                <div
                  key={cell.boxNo}
                  title={cell.lockUser ? `锁定: ${cell.lockUser}` : undefined}
                  style={{
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: colorMap[cell.status],
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  {cell.boxNo}
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col span={10}>
          <Card title="赏品配置" size="small">
            <ProTable
              rowKey="id"
              search={false}
              options={false}
              pagination={false}
              dataSource={data?.items || []}
              columns={[
                { title: '名称', dataIndex: 'itemName', ellipsis: true },
                { title: '概率', dataIndex: 'probRate', width: 60 },
                { title: '剩余', dataIndex: 'surplusCount', width: 60 },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}
