/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { UploadOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Modal, Select, Upload } from 'antd';
import { RcFile, UploadChangeParam, UploadFile } from 'antd/es/upload';
import { useEffect, useState } from 'react';
import { systemIconOptions, SystemIconType } from 'src/data/system-icon';

export interface UploadParams {
  fileName: string;
  fileType: SystemIconType;
  file: Blob;
}

interface Props {
  open: boolean;
  onClose: () => void;
  handleUpload: (params: UploadParams) => void;
}

// MB
const maxUploadSize = 10;

const UploadIconModal = (props: Props) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<UploadParams>();
  const { open, onClose, handleUpload } = props;
  const [file, setFile] = useState<
    UploadChangeParam<UploadFile<UploadFile>> | undefined
  >(undefined);

  const iconBeforeUpload = (
    file: RcFile,
  ): false | typeof Upload['LIST_IGNORE'] => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      messageApi.error('只能上传JPG/PNG类型文件!');
      return Upload.LIST_IGNORE;
    }
    const isSize = file.size / 1024 / 1024 < maxUploadSize;
    if (!isSize) {
      messageApi.error(`上传文件大小应小于${maxUploadSize}M!`);
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const fileChange = (info: UploadChangeParam<UploadFile>) => {
    const fileName = info.file.name;
    const inputName = form.getFieldValue('fileName');
    if (!inputName) {
      form.setFieldValue('fileName', fileName);
    }
    if (info.file.status === 'removed') {
      setFile(undefined);
    } else {
      setFile(info);
    }
  };

  const handleOk = async () => {
    const res: { fileName: string; fileType: SystemIconType } =
      await form.validateFields();
    if (file) {
      handleUpload({
        fileName: res.fileName,
        file: file.file as unknown as Blob,
        fileType: res.fileType,
      });
    } else {
      messageApi.error('上传图片不能为空');
    }
  };

  useEffect(() => {
    if (open) form.resetFields();
  }, [open]);
  return (
    <Modal
      title="上传图标"
      open={open}
      onCancel={() => onClose()}
      onOk={handleOk}
      destroyOnClose
    >
      <Form form={form} name="uploadIconForm">
        <Form.Item
          label="图标名"
          name="fileName"
          rules={[
            {
              required: true,
              message: '图标名称不能为空',
              validateTrigger: 'change',
            },
          ]}
        >
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item
          label="类型"
          name="fileType"
          rules={[
            {
              required: true,
              message: '类型不能为空',
              validateTrigger: 'change',
            },
          ]}
        >
          <Select options={systemIconOptions} placeholder="请选择" />
        </Form.Item>
        <Upload
          accept="image/png, image/jpeg"
          beforeUpload={(file: RcFile) => iconBeforeUpload(file)}
          onChange={(info: UploadChangeParam<UploadFile>) => fileChange(info)}
          listType="picture"
          maxCount={1}
        >
          <Button type="default" icon={<UploadOutlined />}>
            上传图标
          </Button>
          <i style={{ fontSize: '12px', marginLeft: '10px' }}>
            (小于{maxUploadSize}M)
          </i>
        </Upload>
      </Form>
      {contextHolder}
    </Modal>
  );
};

UploadIconModal.displayName = 'UploadIconModal';

export default UploadIconModal;
