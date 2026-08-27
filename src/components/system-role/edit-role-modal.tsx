/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import { SystemRoleItem } from 'src/data/system-role';

export interface FormValues {
  roleName: string;
  roleDescription?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  initialValues?: SystemRoleItem;
  handleSave: (
    params: Omit<SystemRoleItem, 'roleId'> & { roleId?: string },
  ) => void;
}

const EditRoleModal = (props: Props) => {
  const [form] = Form.useForm();
  const { open, onClose, handleSave, initialValues } = props;

  const handleOk = async () => {
    const formValues: FormValues = await form.validateFields();
    handleSave({
      ...formValues,
      roleId: initialValues?.roleId,
    });
    form.resetFields();
  };

  useEffect(() => {
    if (open) form.setFieldsValue(initialValues);
  }, [open]);
  return (
    <Modal
      title="编辑"
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={handleOk}
      destroyOnClose
    >
      <Form
        labelCol={{
          span: 4,
        }}
        form={form}
        name="editRoleForm"
      >
        <Form.Item
          label="角色名称"
          name="roleName"
          rules={[
            {
              required: true,
              message: '角色名称不能为空',
              validateTrigger: 'change',
            },
          ]}
        >
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item label="角色描述" name="roleDescription">
          <Input autoComplete="off" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

EditRoleModal.displayName = 'EditRoleModal';

export default EditRoleModal;
