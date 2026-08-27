/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { Provider } from 'react-redux';
import { ReactNode, useState } from 'react';
import { Root, createRoot } from 'react-dom/client';
import { Modal as AntdModal, Button, ModalProps, Space } from 'antd';

import store from 'src/app/store/configure-store';
import { AntdThemeProvider } from 'src/styles/theme/antd-theme-provider';

type FormModalProps = {
  content: ReactNode;
  onOk: () => Promise<void>;
  afterClose?: () => void;
  root?: Root;
} & ModalProps;

function Modal({ content, onOk, afterClose, root, ...rest }: FormModalProps) {
  const [open, setOpen] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onOk();
      setOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <AntdThemeProvider>
      <AntdModal
        open={open}
        onCancel={handleClose}
        maskClosable={false}
        destroyOnClose
        afterOpenChange={(open) => {
          if (open) return;
          afterClose?.();
          setTimeout(() => {
            const el = document.getElementById('form-modal');
            root?.unmount();
            el?.remove();
          });
        }}
        footer={
          <Space>
            <Button onClick={handleClose}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              确定
            </Button>
          </Space>
        }
        {...rest}
      >
        {content}
      </AntdModal>
    </AntdThemeProvider>
  );
}

const FormModal = {
  open(props: FormModalProps) {
    const el = document.createElement('div');
    el.id = 'form-modal';
    document.body.appendChild(el);

    const root = createRoot(el!);
    root.render(
      <Provider store={store}>
        <Modal {...props} root={root} />
      </Provider>,
    );
  },
};

export default FormModal;
