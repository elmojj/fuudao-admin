/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { BulbOutlined, BulbTwoTone } from '@ant-design/icons';
import { Button, ButtonProps } from 'antd';
import useMergedState from 'rc-util/es/hooks/useMergedState';

interface Props {
  showIconText?: boolean;
  active?: boolean;
  onClick: () => void;
  buttonProps?: ButtonProps;
}

const IconContent = ({
  active,
  onClick,
  title,
}: {
  active?: boolean;
  onClick?: () => void;
  title?: string;
}) => {
  if (active)
    return (
      <span>
        <BulbTwoTone title={title} onClick={onClick} />
      </span>
    );
  return <BulbOutlined title={title} onClick={onClick} />;
};

const HighlightIcon = (props: Props) => {
  const { showIconText, active, buttonProps, onClick } = props;

  const [highlightState, setHighlightState] = useMergedState(false, {
    value: active,
  });

  const title = highlightState ? '取消高亮' : '高亮';

  const handleClick = () => {
    setHighlightState((state) => !state);
    onClick();
  };

  return showIconText ? (
    <Button
      type="primary"
      onClick={handleClick}
      title={title}
      icon={<IconContent active={false} />}
      size="small"
      {...buttonProps}
    >
      {title}
    </Button>
  ) : (
    <IconContent title={title} active={highlightState} onClick={handleClick} />
  );
};

export default HighlightIcon;
