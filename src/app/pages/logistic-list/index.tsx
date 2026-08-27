'use client';

import type {
  ActionType,
  FormInstance,
  ParamsType,
  ProColumns,
} from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Image, Space, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { useAppLocation } from 'src/utils/app-navigation';
import getLogisticList, {
  exportLogisticsData,
  logisticSignBatch,
} from 'src/app/request/logistic-list';
import { getLogisticsStatusText } from 'src/app/request/order-list';
import { useBaseSlice } from 'src/app/store/base';
import useAddAndEditLogisticModal from './use-add-edit-logistic-modal';

export type TableListItem = {
  key: number;
  id: string;
  indexIds: string;
  orderIds: string;
  userId: string;
  trackingNumber: string;
  trackingToken: string;
  deliveryId: string;
  address: string;
  area: string;
  city: string;
  province: string;
  consignee: string;
  zipcode: string;
  phoneNumber: string;
  status: number;
  price: string;
  transactionId: string;
  createdAt: string;
  updatedAt: string;
  indexInfo: {
    id: string;
    grabBagId: string;
    userId: string;
    grabBagItemId: string;
    status: number;
    itemName: string;
    itemCover: string;
    levelId: string;
    levelName: string;
    index: number;
    grabBagName: string;
  }[];
  userInfo: {
    nickname: string;
    avatar: string;
  };
  deliveryName: string;
};

export default function LogisticList() {
  useBaseSlice();
  const ref = useRef<ActionType>();
  const formRef = useRef<FormInstance>();
  const { state } = useAppLocation();

  const [selectLogisticLottery, setSelectLogisticLottery] = useState<{
    [key: string]: string[];
  }>({});
  const [selectLogisticList, setSelectLogisticList] = useState<TableListItem[]>(
    [],
  );
  const [sendFlagFlag, setSendFlagFlag] = useState<boolean>(false);
  const [sendSignFlag, setSendSignFlag] = useState<boolean>(false);
  const [ellipsis, setEllipsis] = useState<boolean>(false);

  const { contextModal, toEdit } = useAddAndEditLogisticModal({
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
    getLogisticList(params).then((res) => {
      if (res.status === 'Success') {
        const data: TableListItem[] = res.list.map((item, index) => ({
          key: index,
          id: item.id,
          indexIds: item.indexIds,
          orderIds: item.orderIds,
          userId: item.userId,
          trackingNumber: item.trackingNumber,
          trackingToken: item.trackingToken,
          deliveryId: item.deliveryId,
          address: item.address,
          area: item.area,
          city: item.city,
          province: item.province,
          consignee: item.consignee,
          zipcode: item.zipcode,
          phoneNumber: item.phoneNumber,
          status: item.status,
          price: item.price,
          transactionId: item.transactionId,
          createdAt: dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
          indexInfo: item.indexInfo,
          userInfo: {
            nickname: item.userInfo.nickname,
            avatar: item.userInfo.avatar,
          },
          deliveryName: item.deliveryName,
        }));

        return {
          data,
          total: res.total,
        };
      }
      return {
        data: [],
        total: 0,
      };
    });

  const columns: ProColumns<TableListItem>[] = [
    {
      title: '发货ID',
      dataIndex: 'id',
      ellipsis,
      search: false,
      width: 80,
    },
    {
      title: '订单ID',
      dataIndex: 'orderIds',
      ellipsis,
      search: false,
      width: 80,
    },
    {
      title: '赏品信息',
      dataIndex: 'lotterys',
      ellipsis,
      search: false,
      width: 120,
      render: (_, record) =>
        record.indexInfo.map((item) => (
          <Space key={item.id}>
            <Image src={item.itemCover} wrapperStyle={{ width: '30px' }} />
            <span>{item.itemName}</span>
          </Space>
        )),
    },
    {
      title: '状态',
      dataIndex: 'status',
      order: 0,
      valueType: 'checkbox',
      initialValue: [2],
      fieldProps: {
        options: [
          { value: 2, label: '申请发货' },
          { value: 3, label: '已发货' },
          { value: 4, label: '已签收' },
        ],
      },
      width: 100,
      render: (_, record) => getLogisticsStatusText(record.status),
    },
    {
      title: '快递单号',
      dataIndex: 'trackingNumber',
      search: false,
      width: 100,
    },
    {
      title: '物流公司',
      dataIndex: 'deliveryName',
      search: false,
      width: 100,
    },
    {
      title: '用户ID',
      dataIndex: 'userId',
      order: 1,
      width: 100,
    },
    {
      title: '用户自定义名',
      dataIndex: 'customName',
      search: false,
      width: 100,
      render: (_, reocrd) => reocrd.userInfo.nickname,
    },
    {
      title: '收货信息',
      dataIndex: 'stockpileCount',
      search: false,
      width: 100,
      render: (_, record) =>
        `收件人: ${record.consignee} 号码: ${record.phoneNumber} 地址: ${record.province}${record.city}${record.area}${record.address}`,
    },
    {
      title: '发货时间',
      dataIndex: 'createTime',
      valueType: 'dateTimeRange',
      width: 100,
      ellipsis: true,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      valueType: 'dateTimeRange',
      search: false,
      width: 100,
      ellipsis: true,
    },
    {
      title: '操作',
      width: 150,
      key: 'option',
      valueType: 'option',
      render: (_, record) => [
        record.status === 2 ? (
          <Button
            key="edit"
            type="link"
            onClick={() => {
              toEdit([record.id]);
            }}
          >
            发货
          </Button>
        ) : null,
      ],
    },
  ];

  const exportData = () => {
    const values = formRef.current?.getFieldsValue();

    exportLogisticsData({
      ...values,
      startTime: values.createTime?.[0].format('YYYY-MM-DD HH:mm:ss'),
      endTime: values.createTime?.[1].format('YYYY-MM-DD HH:mm:ss'),
    });
  };

  const statisticLottery = (selectLogisticLists: TableListItem[]) => {
    console.log(selectLogisticLists);

    const lotteryMap: { [key: string]: string[] } = {};
    let sendFlag = true;
    let sendSign = true;

    if (selectLogisticLists.length === 0) {
      sendFlag = false;
      sendSign = false;
    }

    selectLogisticLists.forEach((logistic) => {
      if (logistic.status !== 2) {
        sendFlag = false;
      }
      if (logistic.status !== 3) {
        sendSign = false;
      }
      logistic.indexInfo.forEach((lotteryInfo) => {
        const lottery = lotteryMap[lotteryInfo.itemName];
        if (lottery) {
          lottery.push(lotteryInfo.itemName);
        } else {
          lotteryMap[lotteryInfo.itemName] = [lotteryInfo.itemName];
        }
      });
    });
    setSendFlagFlag(sendFlag);
    setSendSignFlag(sendSign);
    setSelectLogisticList(selectLogisticLists);
    setSelectLogisticLottery(lotteryMap);
  };

  const sendBatch = () => {
    toEdit(selectLogisticList.map((i) => i.id));
  };

  const signBatch = () => {
    logisticSignBatch(selectLogisticList.map((i) => i.id)).then((res) => {
      if (res.status === 'Success') {
        message.success('签收成功！');
        ref.current?.reload();
      }
    });
  };

  useEffect(() => {
    if (state && ref.current) {
      const navState = state as {
        userId?: string;
        status?: number[];
      };
      formRef.current?.setFieldsValue({
        userId: navState.userId,
        status: navState.status,
      });
      formRef.current?.submit();
    }
  }, [state, ref.current]);

  return (
    <>
      <ProTable<TableListItem>
        actionRef={ref}
        formRef={formRef}
        defaultSize="small"
        bordered
        columns={columns}
        request={getTableData}
        rowKey="key"
        rowSelection={{
          type: 'checkbox',
          onChange: (_: React.Key[], selectedRows: TableListItem[]) => {
            statisticLottery(selectedRows);
          },
        }}
        // eslint-disable-next-line react/no-unstable-nested-components
        tableAlertRender={({ selectedRowKeys }) => (
          <Space size={24} wrap>
            <span>已选 {selectedRowKeys.length} 订单</span>
            {Object.keys(selectLogisticLottery).map((i) => (
              <span key={i}>
                <Typography.Text type="secondary">{i}: </Typography.Text>
                <Typography.Text type="danger">
                  {selectLogisticLottery[i].length}
                </Typography.Text>
              </span>
            ))}
          </Space>
        )}
        pagination={{
          showQuickJumper: true,
        }}
        scroll={{ x: 760 }}
        search={{
          defaultCollapsed: false,
        }}
        dateFormatter="string"
        toolBarRender={() => [
          <Button
            key="send"
            onClick={() => {
              setEllipsis(!ellipsis);
            }}
          >
            {ellipsis ? '展示明细' : '隐藏明细'}
          </Button>,
          <Button key="send" onClick={sendBatch} disabled={!sendFlagFlag}>
            批量发货
          </Button>,
          <Button key="complete" onClick={signBatch} disabled={!sendSignFlag}>
            批量签收
          </Button>,
          <Button type="primary" key="primary" onClick={exportData}>
            导出数据
          </Button>,
        ]}
      />
      {contextModal}
    </>
  );
}
