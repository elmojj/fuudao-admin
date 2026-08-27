import { ModalForm, ProForm, ProFormText } from '@ant-design/pro-components';
import { Alert, Form, message } from 'antd';
import { useState } from 'react';

export interface FormDataType {
  logisticsCode: string;
  logisticsCompany: string;
  orderId: string;
}

export default function useAddAndEditModal({
  callBack,
}: {
  callBack?: () => void;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const [form] = Form.useForm<FormDataType>();
  const [id, setId] = useState<string[]>([]);
  const onFinish = async (values: FormDataType) => {
    console.log(values);
    // editCategory(values).then((res) => {
    //   if (res.status === 'Success') {
    //     message.success('保存成功');
    callBack?.();
    setOpen(false);
    //   } else {
    message.error(123); // res.errorMessage);
    //   }
    // });
  };

  const toEdit = (currentData: FormDataType | undefined) => {
    setOpen(true);
    if (currentData) {
      setId(currentData.orderId.split(','));
      form.setFieldsValue(currentData);
    }
  };

  const contextModal = (
    <ModalForm<FormDataType>
      title="发货"
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
      <Alert message={`已选择 ${id?.length} 项`} type="info" showIcon />
      <ProForm.Group>
        <ProFormText width="md" name="orderId" label="" placeholder="" hidden />
        <ProFormText
          width="md"
          name="logisticsCode"
          label="物流单号"
          placeholder="物流单号"
        />
        <ProFormText
          width="md"
          name="logisticsCompany"
          label="物流公司"
          placeholder="物流公司"
        />
      </ProForm.Group>
    </ModalForm>
  );

  return { contextModal, toEdit };
}
