/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { Empty, Input, Spin, Tree, TreeProps } from 'antd';
import { useEffect, useState } from 'react';

const { Search } = Input;

export interface SearchConfig {
  placeholder?: string; // 搜索框的占位符
  onSearch?: (value: string) => void; // 搜索框的回调
}

export interface BaseTreeProps extends TreeProps {
  showSearch?: boolean; // 是否展示搜索框
  searchConfig?: SearchConfig; // 搜索相关配置
  loading?: boolean; // 是否加载中
}

export default function BaseTree({
  showSearch = false,
  searchConfig,
  onSelect,
  onCheck,
  onExpand,
  treeData,
  loading,
  ...rest
}: BaseTreeProps) {
  const [checkedKeys, setCheckedKeys] = useState<TreeProps['checkedKeys']>(
    rest.checkedKeys ?? [],
  );

  const handleSelect: TreeProps['onSelect'] = (keys, info) => {
    onSelect?.(keys, info);
  };

  const handleCheck: TreeProps['onCheck'] = (keys, info) => {
    onCheck?.(keys, info);
    setCheckedKeys(keys);
  };

  const handleExpand: TreeProps['onExpand'] = (keys, info) => {
    onExpand?.(keys, info);
  };

  const handleSearch = (value: string) => {
    searchConfig?.onSearch?.(value);
  };

  useEffect(() => {
    setCheckedKeys(rest.checkedKeys ?? []);
  }, [rest.checkedKeys]);

  return (
    <Spin spinning={loading}>
      {!loading && showSearch && (
        <Search
          style={{ marginBottom: 8 }}
          placeholder={searchConfig?.placeholder ?? '请输入关键字'}
          onChange={(e) => handleSearch(e.target.value)}
          onSearch={handleSearch}
          allowClear
        />
      )}
      {!loading && treeData && treeData?.length > 0 ? (
        <Tree
          {...rest}
          treeData={treeData}
          onSelect={handleSelect}
          onCheck={handleCheck}
          onExpand={handleExpand}
          checkedKeys={checkedKeys}
        />
      ) : (
        <Empty style={{ marginTop: '50%' }} />
      )}
    </Spin>
  );
}
