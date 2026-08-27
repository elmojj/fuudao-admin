/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { CSSProperties } from 'react';

interface Props {
  text: string;
  title?: string;
  style?: CSSProperties;
}
export default function IconText(props: Props) {
  const { text, title, style } = props;
  return (
    <span style={{ fontFamily: 'iconfont', ...style }} title={title}>
      {text}
    </span>
  );
}
