/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { Modal } from 'antd';
import { ReactNode } from 'react';
import useToken from 'src/styles/use-token';

interface Props {
  showAboutWindow: boolean;
  close: () => void;
}

// eslint-disable-next-line import/prefer-default-export
export const AboutWindow = (props: Props) => {
  const { showAboutWindow, close } = props;
  const { token } = useToken();

  const webVersion: string = process.env.VERSION || '';

  const getAboutTitle = (): ReactNode => {
    const titleContent: ReactNode = (
      <>
        <h2>1</h2>
        <div style={{ margin: '10px 0 30px' }}>
          <div>当前版本： 1</div>
          <div
            style={{
              color: token.colorTextSecondary,
              fontWeight: 400,
              marginTop: '6px',
            }}
          >
            <div>{webVersion}</div>
          </div>
        </div>
      </>
    );
    return titleContent;
  };

  return (
    <Modal
      className="aboutModal"
      destroyOnClose
      title={null}
      open={showAboutWindow}
      footer={null}
      onCancel={close}
    >
      {getAboutTitle()}
    </Modal>
  );
};
