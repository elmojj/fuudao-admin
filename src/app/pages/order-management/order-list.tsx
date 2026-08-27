'use client';

import type {
  ActionType,
  FormInstance,
  ParamsType,
  ProColumns,
} from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Space, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppLocation, useAppNavigate } from 'src/utils/app-navigation';
import getOrderList, { orderStatusOptions } from 'src/app/request/order-list';
import { useBaseSlice } from 'src/app/store/base';
import { selectLotteryListMap } from 'src/app/store/base/selectors';

/**
    订单ID
    福袋ID
    福袋名称
    物流ID
    赏品信息
    购买总数
    总金额(应收)
    积分消耗
    总金额(实收)
    总成本
    总利润
    用户ID
    用户标签
    用户自定义名
    用户分组
    状态
    支付时间
    提货时间
    已等待提货时间
    是否逾期未发货
    发货时间
    物流单号
  * */
export type OrderTableListItem = {
  key: number;
  id: string;
  orderId: string;
  grabBagId: string;
  packageName: string;
  logisticsId: string;
  lotteries: {
    grabBagItemId: string;
    grabBagIndexId: string;
    index: number;
    itemName: string;
    itemCover: string;
  }[];
  needPay: number;
  price: number;
  totalPrice: number;
  coupon: number;
  totalCount: number;
  cost: number;
  profit: number;
  buyUserId: string;
  userTag: string[];
  userCustomName: string;
  userGroup: string;
  status: number;
  payTime: number;
  toSendTime: number;
  waitingToSendTime: number;
  isOutTime: boolean;
  logisticsTime: number;
  logisticsCode: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
};

// const getTimeStateText = (timeRange: [number, number]) => {
//   const currentTime = dayjs();
//   if (currentTime.isAfter(dayjs(timeRange[1]))) {
//     return <Typography.Text type="danger">已过期</Typography.Text>;
//   }
//   if (currentTime.isBefore(dayjs(timeRange[0]))) {
//     return <Typography.Text>未开始</Typography.Text>;
//   }
//   return <Typography.Text type="success">进行中</Typography.Text>;
// };

export default function OrderList() {
  useBaseSlice();
  const lotteryListMap = useSelector(selectLotteryListMap);
  const navigate = useAppNavigate();
  const { state } = useAppLocation();
  const ref = useRef<ActionType>();
  const formRef = useRef<FormInstance>();
  const [isOutTime, setIsOutTime] = useState<'全部' | '是' | '否'>('全部');
  const [costSum, setCostSum] = useState<number>(0);
  const [totalPriceSum, setTotalPriceSum] = useState<number>(0);
  const [profileSum, setProfileSum] = useState<number>(0);

  // const { contextModal, toEdit } = useAddAndEditModal({
  //   callBack: () => ref.current?.reload(),
  // });

  const getLotteryCost = (lotterys: any[]) => {
    let cost = 0;
    lotterys.forEach((item) => {
      const lottery = lotteryListMap[item.itemName];
      cost += Number(lottery?.price ?? 0);
    });
    return cost;
  };

  const getTableData = (
    params: ParamsType & {
      pageSize?: number | undefined;
      current?: number | undefined;
      keyword?: string | undefined;
    },
  ) =>
    // 表单搜索项会从 params 传入，传递给后端接口。
    getOrderList(params).then((res) => {
      if (res.status === 'Success') {
        const data: OrderTableListItem[] = res.list.map((item, index) => ({
          key: index,
          id: item.id,
          orderId: item.id,
          grabBagId: item.grabBagId,
          packageName: item.bagInfo.packageName,
          logisticsId: item.logisticsId,
          lotteries: item.lotteryResult,
          needPay: Number(item.totalPrice),
          price: Number(item.totalPrice),
          totalPrice: Number(item.totalPrice),
          count: item.totalCount,
          coupon: 0,
          totalCount: Number(item.totalCount),
          cost: getLotteryCost(item.lotteryResult),
          profit: Number(item.totalPrice) - getLotteryCost(item.lotteryResult),
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

  const navigateToUserDetail = (grabBagId: string) => {
    navigate('/userManagement/userDetail', {
      state: {
        userInfo: { id: grabBagId },
      },
    });
  };

  // const toLogistics = (record: FormDataType) => {
  //   toEdit({
  //     orderId: record.orderId,
  //     logisticsCode: record.logisticsCode ?? '',
  //     logisticsCompany: '韵达快递',
  //   });
  // };

  // const confirm = (record: OrderTableListItem[]) => {
  //   console.log(record);
  // };

  const columns: ProColumns<OrderTableListItem>[] = [
    { title: '订单ID', dataIndex: 'id', width: 100, ellipsis: true },
    {
      title: '福袋ID',
      dataIndex: 'grabBagId',
      width: 100,
      ellipsis: true,
      hidden: true,
      search: false,
    },
    {
      title: '用户ID',
      dataIndex: 'buyUserId',
      width: 100,
      ellipsis: true,
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => navigateToUserDetail(record.buyUserId)}
        >
          {record.buyUserId}
        </Button>
      ),
    },
    {
      title: '福袋名称',
      dataIndex: 'packageName',
      width: 100,
      ellipsis: true,
      // render: (_, record) => (
      //   <Button type="link" onClick={() => navigateTo(record.grabBagId)}>
      //     {record.packageName}
      //   </Button>
      // ),
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
      title: '总成本',
      dataIndex: 'cost',
      width: 100,
      ellipsis: true,
      search: false,
    },
    {
      title: '总利润',
      dataIndex: 'profit',
      width: 100,
      ellipsis: true,
      search: false,
    },
    // {
    //   title: '用户标签',
    //   dataIndex: 'userTag',
    //   width: 100,
    //   ellipsis: true,
    //   render: (_, record) =>
    //     record.tags.map((name) => (
    //       <Tag color="error" key={name}>
    //         {name}
    //       </Tag>
    //     )),
    // },
    // {
    //   title: '用户自定义名',
    //   dataIndex: 'userCustomName',
    //   width: 100,
    //   ellipsis: true,
    // },
    // { title: '用户分组', dataIndex: 'userGroup', width: 100, ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      ellipsis: true,
      valueType: 'checkbox',
      initialValue: [2, 5, 7, 9],
      fieldProps: {
        options: orderStatusOptions,
      },
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
      title: '订单创建开始时间',
      dataIndex: 'buyTimeStart',
      valueType: 'dateTime',
      hidden: true,
    },
    {
      title: '订单创建结束时间',
      dataIndex: 'buyTimeEnd',
      valueType: 'dateTime',
      hidden: true,
    },
    {
      title: '逾期未发货',
      dataIndex: 'isOutTime',
      valueType: 'radioButton',
      initialValue: '全部',
      fieldProps: {
        options: ['全部', '是', '否'],
        onChange: (e) => {
          const { value } = e.target;
          setIsOutTime(value as '全部' | '是' | '否');
        },
      },
      width: 80,
      ellipsis: true,
      render: (_, record) =>
        record.status === 2 && record.isOutTime ? (
          <Typography.Text type="danger">是</Typography.Text>
        ) : (
          <Typography.Text>否</Typography.Text>
        ),
    },
    {
      title: '发货时间',
      search: false,
      dataIndex: 'logisticsTime',
      width: 120,
      ellipsis: true,
      render: (_, record) =>
        dayjs(record.toSendTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '物流单号',
      search: false,
      dataIndex: 'logisticsCode',
      width: 100,
      ellipsis: true,
      copyable: true,
    },
  ];

  useEffect(() => {
    if (isOutTime === '是') {
      formRef.current?.setFieldsValue({
        buyTimeEnd: dayjs().subtract(1, 'month').format('YYYY-MM-DD HH:mm:ss'),
        buyTimeStart: undefined,
      });
    }
    if (isOutTime === '否') {
      formRef.current?.setFieldsValue({
        buyTimeEnd: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        buyTimeStart: dayjs()
          .subtract(1, 'month')
          .format('YYYY-MM-DD HH:mm:ss'),
      });
    }
    if (isOutTime === '全部') {
      formRef.current?.setFieldsValue({
        buyTimeEnd: undefined,
        buyTimeStart: undefined,
      });
    }
  }, [isOutTime]);
  useEffect(() => {
    if (state && ref.current) {
      const navState = state as {
        userId?: string;
        status?: string | number;
        isOutTime?: string;
      };
      formRef.current?.setFieldsValue({
        buyUserId: navState.userId,
        status: navState.status,
        isOutTime: navState.isOutTime,
      });
      formRef.current?.submit();
    }
  }, [state, ref.current]);

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
  };

  return (
    <ProTable<OrderTableListItem>
      rowSelection={{
        selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
        onChange(selectedRowKeys, selectedRows) {
          statisticData(selectedRows);
        },
        alwaysShowAlert: true,
      }}
      // eslint-disable-next-line react/no-unstable-nested-components
      tableAlertRender={({ selectedRowKeys, onCleanSelected }) => (
        <Space size={24}>
          <span>
            已选 {selectedRowKeys.length} 项
            <Button
              type="link"
              style={{ marginInlineStart: 8 }}
              onClick={onCleanSelected}
            >
              取消选择
            </Button>
          </span>
        </Space>
      )}
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
      actionRef={ref}
      formRef={formRef}
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
      toolBarRender={() => [
        <Button type="primary" key="primary">
          导出数据
        </Button>,
      ]}
    />
  );
}
