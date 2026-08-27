/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { Button, Empty, Modal, Tree } from 'antd';
import { DataNode } from 'antd/es/tree';
import { Key, ReactNode } from 'react';

interface ExtendedDataNode extends DataNode {
  key: Key;
  children?: ExtendedDataNode[];
}

const collectChildKeys = (node: ExtendedDataNode, keys: Key[] = []): Key[] => {
  keys.push(node.key);
  if (node.children) {
    node.children.forEach((child) => collectChildKeys(child, keys));
  }
  return keys;
};

interface Props {
  open: boolean;
  onClose: () => void;
  treeData: DataNode[];
  checkedKeys: Key[];
  setCheckedKeys: (checkedKeys: Key[]) => void;
  onSave: () => void;
}
const EditRoleFunctionModal = (props: Props) => {
  const { open, onClose, treeData, checkedKeys, setCheckedKeys, onSave } =
    props;

  const handleSelectSubTree = (node: ExtendedDataNode) => {
    const newCheckedKeys = new Set<Key>(checkedKeys);
    collectChildKeys(node).forEach((key) => newCheckedKeys.add(key));
    setCheckedKeys(Array.from(newCheckedKeys));
  };

  const renderTreeTitle = (node: ExtendedDataNode): ReactNode => (
    <>
      {node?.title?.toString()}
      {node.children && (
        <Button type="link" onClick={() => handleSelectSubTree(node)}>
          全选
        </Button>
      )}
    </>
  );

  return (
    <Modal
      title="分配功能"
      open={open}
      onCancel={() => {
        onClose();
      }}
      onOk={() => onSave()}
      destroyOnClose
    >
      {treeData.length > 0 ? (
        <Tree
          checkable
          treeData={treeData}
          checkedKeys={checkedKeys}
          // 取消父子节点选中状态关联，父节点为导航或者页面（和功能为同级关系，但结构为父子关系）
          checkStrictly
          onCheck={(checked: { checked: Key[]; halfChecked: Key[] } | Key[]) =>
            setCheckedKeys(Array.isArray(checked) ? checked : checked.checked)
          }
          titleRender={renderTreeTitle}
        />
      ) : (
        <Empty />
      )}
    </Modal>
  );
};

EditRoleFunctionModal.displayName = 'EditRoleFunctionModal';

export default EditRoleFunctionModal;
