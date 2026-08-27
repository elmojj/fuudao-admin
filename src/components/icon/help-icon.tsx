/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip, TooltipProps } from 'antd';

interface Props {
  title: string;
  tooltipProps?: TooltipProps;
  style?: React.CSSProperties;
}

const HelpIcon = (props: Props) => {
  const { title, style, tooltipProps } = props;
  return (
    <Tooltip {...tooltipProps} title={title}>
      <QuestionCircleOutlined style={style} />
    </Tooltip>
  );
};

HelpIcon.displayName = 'HelpIcon';

export default HelpIcon;
