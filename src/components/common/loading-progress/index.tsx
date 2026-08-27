/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { Spin } from 'antd';
import { LoadingProgressWrapper } from './style';

interface Props {
  loading: boolean;
}

const LoadingProgress = (props: Props) => {
  const { loading } = props;

  if (!loading) return null;

  return (
    <LoadingProgressWrapper>
      <Spin spinning={loading} size="large" />
    </LoadingProgressWrapper>
  );
};

LoadingProgress.displayName = 'LoadingProgress';

export default LoadingProgress;
