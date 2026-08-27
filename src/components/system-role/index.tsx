/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import {
  DeleteOutlined,
  EditOutlined,
  FunctionOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { Button, Input, Popconfirm, Space, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { useEffect } from 'react';
import { SystemRoleItem, SystemRoleList } from 'src/data/system-role';
import { SystemRoleWrapper } from './style';

const { Search } = Input;

interface Props {
  loading: boolean;
  data: SystemRoleList;
  keyword?: string;
  getData: (keyword?: string) => void;
  onKeywordChange: (value: string) => void;
  onEdit: (params?: SystemRoleItem) => void;
  onDelete: (roleId: string) => void;
  onEditFunction: (params: SystemRoleItem) => void;
}

const SystemRole = (props: Props) => {
  const {
    loading,
    data,
    keyword,
    getData,
    onEdit,
    onDelete,
    onKeywordChange,
    onEditFunction,
  } = props;
  const columns: ColumnsType<SystemRoleItem> = [
    {
      title: '序号',
      key: 'index',
      render: (_: string, r: SystemRoleItem, index) => index + 1,
    },
    {
      title: '角色名称',
      key: 'roleName',
      dataIndex: 'roleName',
    },
    {
      title: '角色描述',
      key: 'roleDescription',
      dataIndex: 'roleDescription',
    },
    {
      title: '操作',
      key: 'operate',
      width: 150,
      render: (_: string, record) => (
        <Space>
          <Button type="link" onClick={() => onEdit(record)}>
            <EditOutlined title="编辑" />
          </Button>
          <Button type="link" onClick={() => onEditFunction(record)}>
            <FunctionOutlined title="功能" />
          </Button>

          <Popconfirm
            title="提示"
            description="此操作将永久删除该角色，是否继续?"
            onConfirm={() => onDelete(record.roleId)}
            okText="是"
            cancelText="否"
          >
            <Button type="link" danger>
              <DeleteOutlined title="删除" />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleOnSearch = (value: string) => {
    getData(value);
  };

  useEffect(() => {
    getData();
  }, []);
  return (
    <SystemRoleWrapper>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <span>角色管理</span>
        <Space>
          <Search
            value={keyword}
            placeholder="请输入关键字搜索"
            onSearch={handleOnSearch}
            onChange={(e) => onKeywordChange(e.target.value)}
            loading={loading}
            enterButton
          />
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => onEdit()}
          >
            添加角色
          </Button>
        </Space>
      </div>
      <Table
        rowKey="roleId"
        loading={loading}
        columns={columns}
        dataSource={data ?? []}
      />
    </SystemRoleWrapper>
  );
};

SystemRole.displayName = 'SystemRole';

export default SystemRole;
