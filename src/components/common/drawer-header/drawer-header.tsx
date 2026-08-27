/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { CloseOutlined } from '@ant-design/icons';
import { CSSProperties } from 'react';
import { SpanClose } from 'src/styles/common-style';
import { HeaderWrapper } from './style';

interface Props {
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  onClose?: () => void;
  headerExtraContent?: React.ReactNode;
  style?: CSSProperties;
}

const DrawerHeader = (props: Props) => {
  const { title, subTitle, onClose, headerExtraContent, style } = props;
  return (
    <HeaderWrapper style={style}>
      {onClose ? (
        <SpanClose onClick={onClose}>
          <CloseOutlined />
        </SpanClose>
      ) : null}
      <div className="drawer-header-title">{title}</div>
      {typeof subTitle !== 'undefined' ? (
        <div className="drawer-header-sub-title">{subTitle}</div>
      ) : null}
      {typeof headerExtraContent !== 'undefined' ? (
        <div className="drawer-header-extra-content">{headerExtraContent}</div>
      ) : null}
    </HeaderWrapper>
  );
};

DrawerHeader.displayName = 'DrawerHeader';

export default DrawerHeader;
