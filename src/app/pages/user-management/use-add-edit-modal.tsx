import {
  ModalForm,
  ProForm,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { Form, message } from 'antd';
import { useState } from 'react';
import { editCategory } from 'src/app/request/bag-category-list';

interface FormData {
  tags?: string;
  userGroup?: string;
  id?: string;
}

export default function useAddAndEditModal({
  callBack,
}: {
  callBack?: () => void;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const [form] = Form.useForm<FormData>();
  const [id, setId] = useState<string | undefined>();
  const onFinish = async (values: FormData) => {
    editCategory(values).then((res) => {
      if (res.status === 'Success') {
        message.success('保存成功');
        callBack?.();
        setOpen(false);
      } else {
        message.error(res.errorMessage);
      }
    });
  };

  const toEdit = (currentData: FormData | undefined) => {
    setOpen(true);
    setId(currentData?.id);
    if (currentData) {
      form.setFieldsValue(currentData);
    }
  };

  const contextModal = (
    <ModalForm<FormData>
      title={id ? '编辑' : '新建'}
      open={open}
      form={form}
      autoFocusFirstInput
      modalProps={{
        destroyOnClose: true,
        onCancel: () => setOpen(false),
      }}
      submitTimeout={2000}
      onFinish={onFinish}
      width={400}
    >
      <ProForm.Group>
        <ProFormText
          width="md"
          name="tags"
          label="用户自定义名称"
          placeholder="用户自定义名称"
        />

        <ProFormText width="md" name="id" label="" placeholder="" hidden />
        <ProFormSelect
          width="xs"
          options={[
            {
              value: 'user',
              label: '普通用户',
            },
            {
              value: 'manager',
              label: '内部用户',
            },
          ]}
          name="userGroup"
          label="用户分组"
        />
      </ProForm.Group>
    </ModalForm>
  );

  return { contextModal, toEdit };
}
