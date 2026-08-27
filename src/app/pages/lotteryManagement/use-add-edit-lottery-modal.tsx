import {
  ModalForm,
  ProForm,
  ProFormSwitch,
  ProFormText,
  ProFormUploadButton,
} from '@ant-design/pro-components';
import { Form, message } from 'antd';
import { RcFile, UploadFile } from 'antd/es/upload';
import { useState } from 'react';
import { uploadRequest } from 'src/app/host-app';
import {
  EditorBagFormType,
  createAndEditLottery,
} from 'src/app/request/lottery-list';

type FormData = EditorBagFormType;

export default function useAddAndEditLotteryModal({
  callBack,
}: {
  callBack?: () => void;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const [form] = Form.useForm<FormData>();
  const [id, setId] = useState<string | undefined>();
  const [productPhotoFile, setProductPhotoFile] = useState<UploadFile[]>([]);

  const onFinish = async (values: FormData) => {
    createAndEditLottery(values).then((res) => {
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

  const uploadFile = (file: RcFile) => {
    const data = new FormData();
    data.append('file', file);
    return uploadRequest({
      params: data,
    }).then((res: any) => {
      form.setFieldValue('productPhoto', res.data);
      setProductPhotoFile([
        {
          uid: 'productPhoto',
          name: 'productPhoto',
          status: 'done',
          url: res.data,
        },
      ]);
      return res.data;
    });
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
        <ProFormText name="id" hidden />
        <ProFormText
          width="md"
          name="productCode"
          label="赏品ID"
          placeholder=" 赏品ID"
        />
        <ProFormText
          width="md"
          name="productName"
          label="赏品名称"
          placeholder="赏品名称"
        />
        <ProFormText
          width="md"
          name="price"
          label="赏品成本"
          placeholder="赏品成本"
        />
        <ProFormText
          width="md"
          name="stockpileCount"
          label="赏品数量"
          placeholder="赏品数量"
        />
        <ProFormText name="productPhoto" label="封面图地址" hidden />
        <ProFormUploadButton
          name="file"
          label="封面图"
          max={1}
          fileList={productPhotoFile}
          fieldProps={{
            name: 'file',
            listType: 'picture-card',
          }}
          action={(file: RcFile) => uploadFile(file)}
        />
      </ProForm.Group>
      <ProFormSwitch name="status" label="状态" />
    </ModalForm>
  );

  return { contextModal, toEdit };
}
