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
import { Drawer as AntdDrawer, Button, DrawerProps, Space } from 'antd';

import store from 'src/app/store/configure-store';
import { AntdThemeProvider } from 'src/styles/theme/antd-theme-provider';

type FormDrawerProps = {
  content: ReactNode;
  onOk?: () => Promise<void>;
  afterClose?: () => void;
  root?: Root;
} & DrawerProps;

function Drawer({ content, onOk, afterClose, root, ...rest }: FormDrawerProps) {
  const [open, setOpen] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onOk?.();
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
      <AntdDrawer
        open={open}
        onClose={handleClose}
        maskClosable={false}
        destroyOnClose
        afterOpenChange={(open) => {
          if (open) return;
          afterClose?.();
          setTimeout(() => {
            const el = document.getElementById('form-drawer');
            root?.unmount();
            el?.remove();
          });
        }}
        extra={
          onOk && (
            <Space>
              <Button onClick={handleClose}>取消</Button>
              <Button type="primary" onClick={handleSubmit} loading={loading}>
                确定
              </Button>
            </Space>
          )
        }
        width={rest.width ?? 800}
        {...rest}
      >
        {content}
      </AntdDrawer>
    </AntdThemeProvider>
  );
}

const FormDrawer = {
  open(props: FormDrawerProps) {
    const el = document.createElement('div');
    el.id = 'form-drawer';
    document.body.appendChild(el);

    const root = createRoot(el!);
    root.render(
      <Provider store={store}>
        <Drawer {...props} root={root} />
      </Provider>,
    );
  },
};

export default FormDrawer;
