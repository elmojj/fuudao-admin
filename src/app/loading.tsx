/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { Spin } from 'antd';
import { createRoot } from 'react-dom/client';

let requestCount = 0;

export function showLoading(message?: string) {
  if (requestCount === 0) {
    const dom = document.createElement('div');
    dom.setAttribute('id', 'axiosLoading');
    document.body.appendChild(dom);
    const root = createRoot(dom);
    root.render(<Spin size="large" tip={message} />);
  }
  requestCount += 1;
}

export function hideLoading() {
  requestCount -= 1;
  if (requestCount === 0) {
    const loadingDom = document.getElementById('axiosLoading');
    if (loadingDom) {
      document.body.removeChild(loadingDom);
    }
  }
}
