'use client';

import type {
  EditableFormInstance,
  ProColumns,
} from '@ant-design/pro-components';
import { EditableProTable } from '@ant-design/pro-components';
import { Button, Descriptions, Input, Select } from 'antd';
import { SortOrder } from 'antd/es/table/interface';
import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  EditorBagItemFormType,
  deleteBagItemBatch,
} from 'src/app/request/bag-item';
import { EditorBagFormType } from 'src/app/request/bag-list';
import getLotteryByBagList from 'src/app/request/bag-lottery-list';
import { GetLotteryLevelListType } from 'src/app/request/lottery-list';
import { useBaseSlice } from 'src/app/store/base';
import {
  selectLotteryLevelList,
  selectLotteryListMap,
} from 'src/app/store/base/selectors';

type DataSourceType = {
  id: React.Key;
  lotteryId: string;
  itemCover?: string;
  itemName?: string;
  levelName?: string;
  levelId?: string;
  count: number;
  cost: number;
  totalCost: number;
  totalPrice: number;
  probably: number;
  extJson: any;
  sort: number;
};

interface Props {
  bagInfo?: EditorBagFormType;
  copyId?: string;
  saveTime?: string;
  save?: (items: EditorBagItemFormType[]) => Promise<boolean>;
}

interface LotteryOptions {
  productName: string;
  productCode: string;
  productPhoto?: string;
  price: string;
  stockpileCount: string;
  status: Number;
  stockpileSaleTotal: string;
}

export default function EditLottery(props: Props) {
  useBaseSlice();
  const { bagInfo, copyId, saveTime, save } = props;
  const lotteryListMap = useSelector(selectLotteryListMap);
  const lotteryLevelList = useSelector(selectLotteryLevelList);
  const bagId = useMemo(() => {
    if (bagInfo?.id) {
      return bagInfo.id;
    }
    if (copyId) {
      return copyId;
    }
    return undefined;
  }, [bagInfo?.id, copyId]);
  const ref = useRef<EditableFormInstance>();
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);
  const [sortedInfo, setSortedInfo] = useState<SortOrder | undefined>('ascend');

  const [dataSource, setDataSource] = useState<readonly DataSourceType[]>([]);
  const [lotteryData, setLotteryData] = useState<{
    [key: string]: LotteryOptions;
  }>({});
  const [options, setOptions] = useState<{ label: string; value: string }[]>(
    [],
  );

  const setDefaultLotteryByBagId = () => {
    getLotteryByBagList({
      pageSize: 5000,
      current: 1,
      id: bagId,
    }).then((res) => {
      if (res.status === 'Success') {
        const data: DataSourceType[] = [];
        res.list.forEach((item) => {
          data.push({
            id: item.id,
            lotteryId: item.id,
            itemCover: item.itemCover,
            itemName: item.itemName,
            levelName: item.levelName,
            levelId: item.levelId,
            count: Number(item.totalCount),
            cost: Number(lotteryListMap[item.itemName]?.price ?? 0),
            totalCost:
              Number(lotteryListMap[item.itemName]?.price ?? 0) *
              Number(item.totalCount),
            totalPrice: Number(item.stockPrice ?? 0) * Number(item.totalCount),
            probably: Number(item.probRate) * 100,
            extJson: item.extJson,
            sort: Number(item.sort),
          });
        });
        setDataSource(data);
      }
    });
  };

  const getLotteryOption = () => {
    const data: { label: string; value: string }[] = [];
    const lotteryInfo: {
      [key: string]: LotteryOptions;
    } = {};

    Object.keys(lotteryListMap).forEach((name) => {
      const item = lotteryListMap[name];

      if (item.status === 1) {
        data.push({
          label: item.productName,
          value: item.productName,
        });
        lotteryInfo[item.productName] = {
          productName: item.productName,
          productCode: item.productCode,
          productPhoto: item.productPhoto,
          price: item.price,
          stockpileCount: item.stockpileCount,
          status: item.status,
          stockpileSaleTotal: item.stockpileSaleTotal,
        };
      }
    });

    setOptions(data);
    setLotteryData(lotteryInfo);
  };

  useEffect(() => {
    getLotteryOption();

    if (bagInfo) {
      setDefaultLotteryByBagId();
    }
  }, [bagInfo]);

  useEffect(() => {
    setSortedInfo('ascend');
  }, [dataSource]);

  const resetData = (item: {
    count: number;
    cost: number;
    lotteryLevel?: string;
    lotteryId?: string;
    lotteryName?: string;
    productPhoto?: string;
  }) => {
    const lotteryInfo = lotteryListMap[item.lotteryName as string];
    const data = {
      count: item.count,
      cost: 0,
      totalCost: 0,
      totalPrice: 0,
      probably: 0,
    };
    if (lotteryInfo) {
      data.cost = Number(lotteryInfo.price);
      data.totalCost = Number(lotteryInfo.price) * Number(data.count);
      data.totalPrice = Number(bagInfo?.price ?? 0) * Number(data.count);
      data.probably =
        Math.round(
          (Number(data.count) / Number(bagInfo?.totalPackage ?? 0)) * 10000,
        ) / 100;
    }
    return data;
  };

  const columns: ProColumns<DataSourceType>[] = [
    {
      title: '排序',
      dataIndex: 'sort',
      width: 100,
      sorter: (a, b) => Number(a.sort) - Number(b.sort),
      sortOrder: sortedInfo,
    },
    {
      title: '赏品ID',
      dataIndex: 'lotteryId',
      readonly: true,
      width: 100,
    },
    {
      title: '图片',
      dataIndex: 'itemCover',
      valueType: 'image',
      readonly: true,
      width: 100,
    },
    {
      title: '赏品名称',
      dataIndex: 'itemName',
      width: 200,
      renderFormItem(schema, config) {
        return (
          <Select
            options={options ?? []}
            onChange={(value) => {
              const datas =
                ref.current?.getFieldsValue()[config.recordKey as number];
              const data = {
                count: datas.count ?? 1,
                lotteryId: lotteryData[value]?.productCode,
                cost: Number(lotteryData[value].price),
                productPhoto: lotteryData[value].productPhoto,
                lotteryName: lotteryData[value].productName,
              };
              const elseData = resetData(data);
              ref.current?.setRowData?.(config.recordKey as number, {
                lotteryId: lotteryData[value].productCode,
                productPhoto: lotteryData[value].productPhoto,
                itemCover: lotteryData[value].productPhoto,
                lotteryName: lotteryData[value].productName,
                ...elseData,
              });
            }}
          />
        );
      },
    },
    {
      title: '赏品等级',
      dataIndex: 'levelId',
      valueType: 'select',
      fieldProps: {
        options: lotteryLevelList.map((item) => ({
          label: item.levelName,
          value: item.id,
        })),
      },
      width: 120,
    },
    {
      title: '赏品总数',
      dataIndex: 'count',
      width: 120,
      renderFormItem(schema, config) {
        return (
          <Input
            onChange={(e) => {
              const data =
                ref.current?.getFieldsValue()[config.recordKey as number];
              const levelType = lotteryLevelList.find(
                (i) => i.id === data.levelId,
              )?.levelType;
              ref.current?.setRowData?.(config.recordKey as number, {
                count: e.target.value,
                probably:
                  levelType === 1
                    ? (
                        (Number(e.target.value) /
                          Number(bagInfo?.totalPackage ?? 0)) *
                        100
                      ).toFixed(2)
                    : '-',
              });
            }}
          />
        );
      },
    },
    {
      title: '单价成本',
      dataIndex: 'cost',
      readonly: true,
      width: 100,
    },
    {
      title: '总成本额',
      dataIndex: 'totalCost',
      width: 100,
      readonly: true,
    },
    {
      title: '总售出额',
      dataIndex: 'totalPrice',
      width: 100,
      readonly: true,
    },
    {
      title: '概率(%)',
      dataIndex: 'probably',
      width: 100,
      readonly: true,
      render: (_, record) => record.probably.toFixed(2),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      render: (text, record, _, action) => [
        <Button
          type="link"
          key="editable"
          onClick={() => {
            action?.startEditable?.(record.id);
          }}
        >
          编辑
        </Button>,
        <Button
          type="link"
          key="delete"
          onClick={() => {
            setDataSource(dataSource.filter((item) => item.id !== record.id));
            if (record.lotteryId) {
              deleteBagItemBatch(record.lotteryId);
            }
          }}
        >
          删除
        </Button>,
        <EditableProTable.RecordCreator
          key="copyLine"
          record={{
            ...record,
            id: dataSource.length + 1,
            sort: dataSource.length + 1,
          }}
        >
          <Button type="link">复制此项到末尾</Button>
        </EditableProTable.RecordCreator>,
      ],
    },
  ];

  const copyLineToNext = (row: DataSourceType, config: any) => {
    const datasMap = ref.current?.getFieldsValue();
    let idx = dataSource.length;
    dataSource.forEach(({ id }, i) => {
      if (id === row.id) {
        idx = i + 1; // 查找新增行开始位置
      }
    });
    const newRow = { ...datasMap[config.recordKey], id: Date.now() };
    const newDataSource = [...dataSource];
    newDataSource.splice(idx, 0, newRow);

    setDataSource(newDataSource);
    setEditableRowKeys(newDataSource.map(({ id }) => id));
  };

  const getLotteryStatistics = (): ReactNode => {
    let totalCount = 0;
    let totalCost = 0;
    let totalPrice = 0;
    dataSource.forEach((item) => {
      if (
        lotteryLevelList.find((i) => i.id === item.levelId)?.levelType === 1
      ) {
        totalCount += Number(item.count);
      }
      totalCost += Number(item.cost) * Number(item.count);
      totalPrice += Number(item.count) * Number(bagInfo?.price);
    });
    const items = [
      {
        key: 'totalCount',
        label: '总数量',
        children: `${totalCount}/${bagInfo?.totalPackage}`,
      },
      {
        key: 'totalProbably',
        label: '总概率',
        children: `${(
          (totalCount * 100) /
          Number(bagInfo?.totalPackage)
        ).toFixed(4)}%`,
      },
      {
        key: 'totalCost',
        label: '总成本',
        children: `￥${totalCost}`,
      },
      {
        key: 'totalPrice',
        label: '理论全售出额',
        children: `￥${totalPrice.toFixed(2)}`,
      },
    ];
    return <Descriptions title="" size="small" column={4} items={items} />;
  };

  const onChange = (value: readonly DataSourceType[]) => {
    setDataSource(
      value.map((item) => ({
        ...item,
        probably:
          (Number(item.count) / Number(bagInfo?.totalPackage ?? 0)) * 100,
      })),
    );
  };

  const onFinish = () => {
    const items: EditorBagItemFormType[] = [];
    const lotteryLevelMap: { [key: string]: GetLotteryLevelListType } = {};
    lotteryLevelList.forEach((i) => {
      lotteryLevelMap[i.id] = i;
    });
    dataSource.forEach((item) => {
      const levelInfo = lotteryLevelMap[item.levelId ?? 'level_normal'];
      const lotteryInfo = lotteryListMap[item.itemName as string];
      items.push({
        id: item.id as string,
        grabBagId: bagInfo?.id ?? '',
        itemName: item.itemName ?? '',
        levelId: (item.levelId ?? 'level_normal') as unknown as number,
        itemCover: lotteryInfo?.productPhoto ?? '',
        totalCount: item.count ?? 0,
        sendCount: item.count ?? 0,
        surplusCount: item.count ?? 0,
        referPrice: (item.cost ?? 0).toString(),
        probRate:
          levelInfo?.levelType === 1
            ? ((item.probably ?? 0) / 100).toString()
            : '1',
        status: 1,
        stockId: (lotteryInfo?.id ?? item.lotteryId ?? '') as unknown as number,
        extJson: item.extJson,
        sort: item.sort,
      });
    });
    save?.(items);
  };

  useEffect(() => {
    if (saveTime) onFinish();
  }, [saveTime]);

  return (
    <EditableProTable<DataSourceType>
      editableFormRef={ref}
      headerTitle={getLotteryStatistics()}
      columns={columns}
      rowKey="id"
      scroll={{
        x: 960,
      }}
      value={dataSource}
      onChange={(value: readonly DataSourceType[]) => onChange(value)}
      recordCreatorProps={{
        newRecordType: 'dataSource',
        record: () => ({
          id: Date.now(),
          count: 1,
          cost: 0,
          lotteryId: '',
          totalCost: 0,
          totalPrice: 0,
          probably: 0,
          sort: 0,
          extJson: '',
        }),
      }}
      editable={{
        type: 'multiple',
        editableKeys,
        actionRender: (row, config, defaultDoms) => [
          defaultDoms.delete,
          <Button
            type="link"
            key="copyLineToNext"
            onClick={() => copyLineToNext(row, config)}
          >
            复制到下一行
          </Button>,
        ],
        onValuesChange: (record, recordList) => {
          setDataSource(recordList);
        },
        onChange: setEditableRowKeys,
      }}
    />
  );
}
