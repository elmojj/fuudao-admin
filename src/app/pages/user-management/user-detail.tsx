'use client';

import type {
  ActionType,
  ParamsType,
  ProColumns,
} from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  Button,
  Descriptions,
  DescriptionsProps,
  Radio,
  Space,
  Table,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppLocation, useAppNavigate } from 'src/utils/app-navigation';
import { OrderTableListItem } from 'src/app/pages/order-management/order-list';
import getOrderList, {
  getOrderStatusText,
  logisticsOrder,
} from 'src/app/request/order-list';
import { GetUserListType, getUserById } from 'src/app/request/user-manager';
import {
  selectBagListMap,
  selectLotteryListMap,
} from 'src/app/store/base/selectors';
// import useAddAndEditModal from './use-add-edit-modal';

export type TableListItem = {
  id: string;
  key: number;
  phoneNumber: string;
  nickname: string;
  avatar: string;
  appid: string;
  openid: string;
  unionid: string;
  sessionKey: string;
  accessToken: string;
  updatedAt: string;
  createdAt: string;
  createTime: number;
  updateTime: number;
  userGroupName: string;
  stats: {
    buyAmountTotal: number;
    buyTotal: number;
    rewardTotal: number;
  };
  buyAmountTotal: number;
  buyTotal: number;
  rewardTotal: number;
  tags: {
    cate: string;
    cateVal: string;
    tagName: string;
  }[];
  address: {
    address?: string;
    area?: string;
    city?: string;
    consignee?: string;
    createdAt?: string;
    id?: string;
    isDefault?: number;
    phoneNumber?: string;
    province?: string;
    status?: number;
    updatedAt?: string;
    userId?: string;
    zipcode?: string;
  };
  defaultAddress?: string;
};

export const statusOption = [
  { label: '全部', value: '2,5,7,9' },
  { label: '待提货', value: '2' },
  { label: '已提货待发货', value: '5' },
  { label: '已发货', value: '7' },
  { label: '已完成', value: '9' },
  { label: '已逾期', value: 'O2' },
];

export default function UserDetail() {
  const navigate = useAppNavigate();
  const { state } = useAppLocation();
  const lotteryListMap = useSelector(selectLotteryListMap);
  const bagListMap = useSelector(selectBagListMap);
  const { userInfo } = (state || {}) as { userInfo?: { id: string } };
  const ref = useRef<ActionType>();
  const [value, setValue] = useState<string>('2,5,7,9');
  const [endTime, setEndTime] = useState<string | undefined>();
  const [costSum, setCostSum] = useState<number>(0);
  const [totalPriceSum, setTotalPriceSum] = useState<number>(0);
  const [profileSum, setProfileSum] = useState<number>(0);
  const [selectOrderList, setSelectOrderList] = useState<OrderTableListItem[]>(
    [],
  );
  const [currentUserInfo, setCurrentUserInfo] = useState<
    GetUserListType | undefined
  >();

  const getLotteryCost = (lotterys: any[]) => {
    let cost = 0;
    lotterys.forEach((item) => {
      const lottery = lotteryListMap[item.itemName];
      cost += Number(lottery?.price ?? 0);
    });
    return cost;
  };

  const onChange = (e: any) => {
    setValue(e.target.value);
    if (e.target.value === 'O2') {
      setEndTime(dayjs().subtract(1, 'month').format('YYYY-MM-DD HH:mm:ss'));
    } else {
      setEndTime(undefined);
    }

    ref.current?.reload();
  };

  useEffect(() => {
    if (userInfo) {
      getUserById(userInfo.id).then((res) => {
        if (res.status === 'Success') {
          setCurrentUserInfo(res.value);
        }
      });
    }
  }, [userInfo]);

  const getTableData = (
    params: ParamsType & {
      pageSize?: number | undefined;
      current?: number | undefined;
      keyword?: string | undefined;
    },
  ) => {
    let buyTimeEnd = endTime;
    if (endTime && params.beforeTime === '5天') {
      buyTimeEnd = dayjs(buyTimeEnd)
        .subtract(5, 'day')
        .format('YYYY-MM-DD HH:mm:ss');
    }
    if (endTime && params.beforeTime === '10天') {
      buyTimeEnd = dayjs(buyTimeEnd)
        .subtract(10, 'day')
        .format('YYYY-MM-DD HH:mm:ss');
    }
    return getOrderList({
      ...params,
      id: params.orderId,
      buyUserId: currentUserInfo?.id,
      status: value === 'O2' ? [2] : value.split(','),
      buyTimeEnd,
    }).then((res) => {
      if (res.status === 'Success') {
        const data: OrderTableListItem[] = res.list.map((item, index) => {
          const bagInfo = bagListMap[item.bagInfo.id];
          return {
            key: index,
            id: item.id,
            orderId: item.id,
            grabBagId: item.grabBagId,
            packageName: bagInfo?.packageName ?? '-',
            logisticsId: item.logisticsId,
            lotteries: item.lotteryResult,
            needPay: Number(item.totalPrice),
            price: Number(item.totalPrice),
            totalPrice: Number(item.totalPrice),
            count: item.totalCount,
            coupon: 0,
            totalCount: Number(item.totalCount),
            cost: getLotteryCost(item.lotteryResult),
            profit:
              Number(item.totalPrice) - getLotteryCost(item.lotteryResult),
            buyUserId: item.buyUserId,
            userTag: item.user.tags,
            userCustomName: item.user.nickname,
            userGroup: item.user.userGroup,
            status: item.status,
            payTime: dayjs(item.createdAt).valueOf(),
            toSendTime: dayjs(item.createdAt).valueOf(),
            waitingToSendTime: dayjs(item.createdAt).valueOf(),
            isOutTime: dayjs().diff(dayjs(item.createdAt), 'day') > 30,
            logisticsTime: dayjs(item.createdAt).valueOf(),
            logisticsCode: item.logisticsId,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            createTime: dayjs(item.createdAt).valueOf(),
            updateTime: dayjs(item.updatedAt).valueOf(),
          };
        });

        return {
          data,
        };
      }
      return {
        data: [],
      };
    });
  };
  // 表单搜索项会从 params 传入，传递给后端接口。

  const columns: ProColumns<OrderTableListItem>[] = [
    { title: '订单ID', dataIndex: 'orderId', width: 100, ellipsis: true },
    {
      title: '前推逾期时间',
      dataIndex: 'beforeTime',
      hidden: true,
      valueType: 'radioButton',
      initialValue: '无',
      fieldProps: {
        options: ['无', '5天', '10天'],
      },
    },
    {
      title: '福袋名称',
      dataIndex: 'packageName',
      width: 100,
      ellipsis: true,
      search: false,
    },
    {
      title: '物流ID',
      dataIndex: 'logisticsId',
      width: 100,
      ellipsis: true,
      search: false,
    },
    {
      title: '赏品信息',
      dataIndex: 'lotteryName',
      width: 100,
      ellipsis: true,
      search: false,
    },
    {
      title: '购买总数',
      dataIndex: 'count',
      width: 100,
      ellipsis: true,
      search: false,
    },
    {
      title: '总金额(应收)',
      dataIndex: 'needPay',
      width: 100,
      ellipsis: true,
      search: false,
    },
    {
      title: '积分消耗',
      dataIndex: 'coupon',
      width: 100,
      ellipsis: true,
      search: false,
    },
    {
      title: '总金额(实收)',
      dataIndex: 'price',
      width: 100,
      ellipsis: true,
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      ellipsis: true,
      search: false,
      render: (_, record) => getOrderStatusText(record.status),
    },
    {
      title: '支付时间',
      dataIndex: 'payTime',
      width: 100,
      ellipsis: true,
      search: false,
    },
    {
      title: '提货时间',
      dataIndex: 'toSendTime',
      width: 120,
      ellipsis: true,
      search: false,
      render: (_, record) =>
        dayjs(record.toSendTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '已等待提货时间',
      dataIndex: 'waitingToSendTime',
      width: 120,
      ellipsis: true,
      search: false,
      render: (_, record) =>
        dayjs(record.waitingToSendTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '是否逾期未发货',
      dataIndex: 'isOutTime',
      width: 80,
      ellipsis: true,
      search: false,
      render: (_, record) =>
        record.status === 2 && record.isOutTime ? (
          <Typography.Text type="danger">是</Typography.Text>
        ) : (
          <Typography.Text>否</Typography.Text>
        ),
    },
    {
      title: '发货时间',
      dataIndex: 'logisticsTime',
      width: 120,
      ellipsis: true,
      search: false,
      render: (_, record) =>
        dayjs(record.toSendTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '物流单号',
      dataIndex: 'logisticsCode',
      width: 100,
      ellipsis: true,
      copyable: true,
      search: false,
      fixed: 'right',
    },
  ];

  const descriptionItems: DescriptionsProps['items'] = [
    {
      key: '1',
      label: '用户姓名',
      children: <p>{currentUserInfo?.address.consignee}</p>,
    },
    {
      key: '2',
      label: '手机号码',
      children: <p>{currentUserInfo?.address.phoneNumber}</p>,
    },
    {
      key: '3',
      label: '微信昵称',
      children: <p>{currentUserInfo?.nickname}</p>,
    },
    {
      key: '5',
      label: '创建时间',
      children: (
        <p>
          {dayjs(Number(`${currentUserInfo?.createdAt}000`)).format(
            'YYYY-MM-DD HH:mm:ss',
          )}
        </p>
      ),
    },
    {
      key: '6',
      label: '更新时间',
      children: (
        <p>
          {dayjs(Number(`${currentUserInfo?.updatedAt}000`)).format(
            'YYYY-MM-DD HH:mm:ss',
          )}
        </p>
      ),
    },
    {
      key: '7',
      label: '默认地址',
      children: (
        <Typography.Text copyable>{`${
          currentUserInfo?.address?.consignee ?? ''
        } ${currentUserInfo?.address?.phoneNumber ?? ''} ${
          currentUserInfo?.address?.province ?? ''
        }${currentUserInfo?.address?.city ?? ''}${
          currentUserInfo?.address?.area ?? ''
        }${currentUserInfo?.address?.address ?? ''}`}</Typography.Text>
      ),
    },
  ];

  const toSendOrder = () => {
    navigate(`/logisticManagement/logisticList`, {
      state: {
        userId: currentUserInfo?.id,
        status: [2],
      },
    });
  };

  const toLogisticsOrders = () => {
    console.log(selectOrderList);
    if (selectOrderList.length > 0) {
      logisticsOrder(selectOrderList.map((i) => i.orderId)).then((res) => {
        if (res.status === 'Success') {
          ref.current?.reload();
        }
      });
    }
  };

  const statisticData = (selectedRows: OrderTableListItem[]) => {
    let cost = 0;
    let totalPrice = 0;
    selectedRows.forEach((i) => {
      cost += i.cost;
      totalPrice += i.totalPrice;
    });
    setCostSum(cost);
    setTotalPriceSum(totalPrice);
    setProfileSum(totalPrice - cost);
    const filterOrder = selectedRows.filter(
      (i) => i.status === 2 && i.isOutTime,
    );
    if (filterOrder.length === selectedRows.length) {
      setSelectOrderList(selectedRows);
    } else {
      setSelectOrderList([]);
    }
  };

  return (
    <PageContainer
      ghost
      header={{
        title: '用户详情',
        breadcrumb: {},
      }}
      content={
        <Descriptions
          column={3}
          style={{ marginBlockEnd: -16 }}
          items={descriptionItems}
        />
      }
    >
      <ProTable<OrderTableListItem>
        // eslint-disable-next-line react/no-unstable-nested-components
        title={() => (
          <Radio.Group
            key={1}
            options={statusOption}
            onChange={onChange}
            value={value}
            optionType="button"
          />
        )}
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
        rowSelection={{
          selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
          onChange(selectedRowKeys, selectedRows) {
            statisticData(selectedRows);
          },
          alwaysShowAlert: true,
        }}
        // eslint-disable-next-line react/no-unstable-nested-components
        tableAlertOptionRender={() => (
          <Space>
            <span>
              <Typography.Text type="secondary">总收入:</Typography.Text>
              <Typography.Text type="success">{totalPriceSum}</Typography.Text>
            </span>
            <span>
              <Typography.Text type="secondary">总成本:</Typography.Text>
              <Typography.Text type="success">{costSum}</Typography.Text>
            </span>
            <span>
              <Typography.Text type="secondary">总利润:</Typography.Text>
              <Typography.Text type={profileSum > 0 ? 'success' : 'danger'}>
                {profileSum}
              </Typography.Text>
            </span>
          </Space>
        )}
        toolBarRender={() => [
          selectOrderList.length > 0 ? (
            <Button key="logistics" onClick={toLogisticsOrders}>
              逾期订单申请发货
            </Button>
          ) : null,
          <Button key="send" onClick={toSendOrder}>
            去合并发货
          </Button>,
        ]}
      />
      {/* {contextModal} */}
    </PageContainer>
  );
}
