/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { useEffect, useState, RefObject } from 'react';

const useClientSizeObserver = (ref: RefObject<HTMLElement> | null = null) => {
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    const targetElement = ref?.current || document.documentElement;

    if (!targetElement) return;

    const handleResize = () => {
      const elementWidth = targetElement.clientWidth;
      const elementHeight = targetElement.clientHeight;
      setWidth(elementWidth);
      setHeight(elementHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(targetElement);

    // eslint-disable-next-line consistent-return
    return () => {
      resizeObserver.unobserve(targetElement);
    };
  }, [ref]);

  return { width, height };
};

export default useClientSizeObserver;
