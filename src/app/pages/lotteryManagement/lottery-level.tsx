'use client';

import type {
  ActionType,
  ParamsType,
  ProColumns,
} from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, message } from 'antd';
import { useRef } from 'react';
import {
  EVERY,
  LAST,
  NORMAL,
  deleteLotteryLevel,
  getLevelTypeName,
  getLotteryLevelList,
} from 'src/app/request/lottery-list';
import useAddAndEditLevelModal from './use-add-edit-level-modal';

export type TableListItem = {
  id: string;
  key: Number;
  levelName: string;
  levelType: NORMAL | EVERY | LAST;
  status: Number;
};

export default function LotteryLevelList() {
  const ref = useRef<ActionType>();
  const { contextModal, toEdit } = useAddAndEditLevelModal({
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
    getLotteryLevelList(params).then((res) => {
      if (res.status === 'Success') {
        const data: TableListItem[] = res.list.map((item, index) => ({
          key: index,
          id: item.id,
          levelName: item.levelName,
          levelType: item.levelType,
          status: item.status,
        }));

        return {
          data,
        };
      }
      return {
        data: [],
      };
    });

  const columns: ProColumns<TableListItem>[] = [
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
      search: false,
    },
    {
      title: '等级ID',
      dataIndex: 'id',
      width: 100,
      search: false,
    },
    {
      title: '等级名称',
      dataIndex: 'levelName',
      width: 100,
      search: false,
    },
    {
      title: '等级类型',
      dataIndex: 'levelType',
      width: 100,
      search: false,
      render: (_, record) => getLevelTypeName(record.levelType),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      search: false,
      render: (_, record) => (record.levelType ? '启用' : '禁用'),
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
              levelName: record.levelName,
              levelType: record.levelType,
              status: record.status,
            })
          }
        >
          编辑
        </Button>,
        <Button
          key="delete"
          type="link"
          onClick={() => {
            if (record.id) {
              deleteLotteryLevel({ id: record.id }).then((res) => {
                if (res.status === 'Success') {
                  ref.current?.reload();
                  message.success('删除成功!');
                } else {
                  message.error(res.errorMessage);
                }
              });
            }
          }}
        >
          删除
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
        search={false}
        columns={columns}
        request={getTableData}
        rowKey="key"
        pagination={{
          showQuickJumper: true,
        }}
        scroll={{ x: 760 }}
        dateFormatter="string"
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => toEdit(undefined)}
          >
            创建赏品等级
          </Button>,
        ]}
      />
      {contextModal}
    </>
  );
}
