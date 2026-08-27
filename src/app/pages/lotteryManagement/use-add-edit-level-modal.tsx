import {
  ModalForm,
  ProForm,
  ProFormRadio,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { Form, message } from 'antd';
import { useState } from 'react';
import {
  EVERY,
  LAST,
  NORMAL,
  editLevel,
  levelOptions,
} from 'src/app/request/lottery-list';

interface FormData {
  levelName: string;
  levelType: NORMAL | EVERY | LAST;
  status: Number;
  id?: string;
}

export default function useAddAndEditLevelModal({
  callBack,
}: {
  callBack?: () => void;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const [form] = Form.useForm<FormData>();
  const [id, setId] = useState<string | undefined>();
  const onFinish = async (values: FormData) => {
    editLevel(values).then((res) => {
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
          name="levelName"
          label="等级名称"
          placeholder="等级名称"
        />
        <ProFormRadio.Group
          width="md"
          name="levelType"
          label="等级类型"
          initialValue={1}
          options={levelOptions}
        />
        <ProFormSwitch name="status" initialValue />

        <ProFormText width="md" name="id" label="" placeholder="" hidden />
      </ProForm.Group>
    </ModalForm>
  );

  return { contextModal, toEdit };
}
