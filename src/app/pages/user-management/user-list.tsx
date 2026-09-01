'use client';

import type {
  ActionType,
  ParamsType,
  ProColumns,
} from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import { useRef } from 'react';
import { useAppNavigate } from 'src/utils/app-navigation';
import getUserList from 'src/app/request/user-manager';
import useAddAndEditModal from './use-add-edit-modal';
import { TableListItem } from './user-detail';

export default function UserList() {
  const navigate = useAppNavigate();
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
    getUserList(params).then((res) => {
      if (res.status === 'Success') {
        const data: TableListItem[] = res.list.map((item, index) => ({
          ...item,
          key: index,
          address: {
            ...item.address,
            province: item.address?.province,
            consignee: item.address?.consignee,
            city: item.address?.city,
            area: item.address?.area,
            address: item.address?.address,
            phoneNumber: item.address?.phoneNumber,
          },
          buyAmountTotal: item.stats.buyAmountTotal,
          buyTotal: item.stats.buyTotal,
          rewardTotal: item.stats.rewardTotal,
          defaultAddress: `${item.address?.consignee ?? ''} ${
            item.address?.phoneNumber ?? ''
          } ${item.address?.province ?? ''}${item.address?.city ?? ''}${
            item.address?.area ?? ''
          }${item.address?.address ?? ''}`,
          phoneNumber: item.address?.phoneNumber ?? '',
          createTime: dayjs(Number(`${item.createdAt}000`)).valueOf(),
          updateTime: dayjs(Number(`${item.updatedAt}000`)).valueOf(),
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
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      ellipsis: true,
    },
    {
      title: '手机号码',
      dataIndex: 'phoneNumber',
      search: false,
      width: 100,
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      search: false,
      width: 100,
    },
    {
      title: '头像',
      dataIndex: 'avatar',
      valueType: 'image',
      align: 'center',
      search: false,
      width: 100,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      width: 100,
      render: (_, record) => (
        <Space direction="vertical">
          {record.tags.map(({ tagName }) => (
            <Tag key={tagName}>{tagName}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '用户分组',
      dataIndex: 'userGroupName',
      search: false,
      width: 100,
    },
    {
      title: '订单数',
      dataIndex: 'buyTotal',
      search: false,
      width: 100,
    },
    {
      title: '赏品总数',
      dataIndex: 'rewardTotal',
      search: false,
      width: 100,
    },
    {
      title: '抽赏次数',
      dataIndex: 'drawChances',
      search: false,
      width: 90,
    },
    {
      title: '积分',
      dataIndex: 'totalScore',
      search: false,
      width: 80,
    },
    {
      title: '图鉴',
      dataIndex: 'collectionCount',
      search: false,
      width: 80,
      render: (_, record) =>
        `${(record as any).collectionCount ?? 0}/${(record as any).collectionTotal ?? 0}`,
    },
    {
      title: '总金额(元)',
      dataIndex: 'buyAmountTotal',
      search: false,
      width: 100,
    },
    {
      title: '默认地址',
      dataIndex: 'defaultAddress',
      search: false,
      width: 100,
      ellipsis: true,
      copyable: true,
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
            toEdit({
              id: record.id,
              userGroup: record.userGroupName,
            })
          }
        >
          编辑
        </Button>,
        <Button
          key="delete"
          type="link"
          onClick={() => {
            navigate('/userManagement/userDetail', {
              state: {
                userInfo: record,
              },
            });
          }}
        >
          查看详情
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
      />
      {contextModal}
    </>
  );
}
