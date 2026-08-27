/*
(C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD. All rights reserved.

This computer source code and related instructions and comments are the
unpublished confidential and proprietary information of Shanghai Huishui
Tech Co., LTD. and are protected under applicable copyright and trade
secret law. They may not be disclosed to, copied or used by any third
party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { Button, ButtonProps } from 'antd';
import { useTheme } from 'styled-components';

export const LinkSpan = (
  props: {
    onClick: () => void;
    children: React.ReactNode;
  } & React.InsHTMLAttributes<HTMLSpanElement>,
) => {
  const { onClick, children, ...intrinsicAttributes } = props;

  const theme = useTheme();
  return (
    <span
      aria-hidden="true"
      role="link"
      onClick={onClick}
      style={{ cursor: 'pointer', color: theme.colorLink }}
      {...intrinsicAttributes}
    >
      {children}
    </span>
  );
};

export const LinkSmallButton = (props: ButtonProps) => {
  const { onClick, children, ...rest } = props;

  return (
    <Button
      {...rest}
      size="small"
      type="link"
      onClick={onClick}
      style={{ padding: 0, margin: 0 }}
    >
      {children}
    </Button>
  );
};
