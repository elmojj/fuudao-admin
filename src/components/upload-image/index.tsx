import { InboxOutlined } from '@ant-design/icons';
import { message } from 'antd';
import Upload, { RcFile, UploadChangeParam, UploadFile } from 'antd/es/upload';
import { useEffect, useState } from 'react';
import { SystemIconType } from 'src/data/system-icon';
import { UploadParams } from '../system-icon/upload-icon-modal';

const maxUploadSize = 10;

interface Props {
  value?: UploadFile<any>[];
  handleUpload: (params: UploadParams) => Promise<boolean>;
  onChange?: (iconName: string) => void;
}

export default function UploadImages(props: Props) {
  const { value, handleUpload, onChange } = props;
  const [messageApi, contextHolder] = message.useMessage();
  const [file, setFile] = useState<
    UploadChangeParam<UploadFile<UploadFile>> | undefined
  >(undefined);

  useEffect(() => {
    if (file) {
      const imageName = file.file.uid;
      handleUpload({
        fileName: imageName,
        file: file.file as unknown as Blob,
        fileType: SystemIconType.menuIcon,
      }).then((flag) => {
        if (flag) {
          onChange?.(imageName);
        }
      });
    }
  }, [file]);

  const iconBeforeUpload = (
    file: RcFile,
  ): false | (typeof Upload)['LIST_IGNORE'] => {
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
    if (info.file.status === 'removed') {
      setFile(undefined);
    } else {
      setFile(info);
    }
  };

  return (
    <>
      <Upload.Dragger
        name="files"
        accept="image/png, image/jpeg"
        fileList={value}
        beforeUpload={(file: RcFile) => iconBeforeUpload(file)}
        onChange={(info: UploadChangeParam<UploadFile>) => fileChange(info)}
        listType="picture"
        maxCount={1}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Click or drag file to this area to upload
        </p>
        <p className="ant-upload-hint">Support for a single or bulk upload.</p>
      </Upload.Dragger>
      {contextHolder}
    </>
  );
}
