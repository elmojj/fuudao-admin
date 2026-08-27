import {
  ModalForm,
  ProForm,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { Form, message } from 'antd';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  EditorLogisticFormType,
  logisticSendBatch,
} from 'src/app/request/logistic-list';
import { logisticStatusOptions } from 'src/app/request/order-list';
import { selectDeliveryList } from 'src/app/store/base/selectors';

type FormData = EditorLogisticFormType;

export default function useAddAndEditLogisticModal({
  callBack,
}: {
  callBack?: () => void;
}) {
  const deliveryList = useSelector(selectDeliveryList);
  const [open, setOpen] = useState<boolean>(false);
  const [form] = Form.useForm<FormData>();
  const [id, setId] = useState<string[]>();
  const onFinish = async (values: FormData) => {
    // if (values.id.length === 1) {
    //   createAndEditLogistic({ ...values, id: values.id[0] }).then((res) => {
    //     if (res.status === 'Success') {
    //       message.success('保存成功');
    //       callBack?.();
    //       setOpen(false);
    //     } else {
    //       message.error(res.errorMessage);
    //     }
    //   });
    // } else if (values.id.length > 1) {
    logisticSendBatch(values).then((res) => {
      if (res.status === 'Success') {
        message.success('保存成功');
        callBack?.();
        setOpen(false);
      } else {
        message.error(res.errorMessage);
      }
    });
    // }
  };

  const toEdit = (ids: string[]) => {
    setOpen(true);
    setId(ids);
    if (ids) {
      form.setFieldsValue({
        id: ids,
        deliveryId: 'YUNDA',
        trackingNumber: '',
        status: 3,
      });
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
      submitTimeout={1000}
      onFinish={onFinish}
      width={400}
      layout="horizontal"
    >
      <ProForm.Group>
        <ProFormText
          width="md"
          name="id"
          label="发货ID"
          placeholder=" 发货ID"
          readonly
        />
        <ProFormRadio.Group
          width="md"
          name="status"
          label="状态"
          placeholder="状态"
          options={logisticStatusOptions}
        />
        <ProFormText
          width="md"
          name="trackingNumber"
          label="物流单号"
          placeholder="物流单号"
        />
        <ProFormSelect
          width="md"
          name="deliveryId"
          options={deliveryList.map((i) => ({
            label: i.deliveryName,
            value: i.deliveryId,
          }))}
          label="物流公司"
          placeholder="物流公司"
        />
      </ProForm.Group>
    </ModalForm>
  );

  return { contextModal, toEdit };
}
