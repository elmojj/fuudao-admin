/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

/** table 序号展示 */
export const renderRowNumber =
  (current: number, pageSize: number, divisor?: number) =>
  (_: unknown, __: unknown, index: number) => {
    const divisorValue = divisor ?? 1;
    return (current - 1) * (pageSize / divisorValue) + index / divisorValue + 1;
  };

export const commonOnCell = (condition: boolean, rowLength: number) => {
  const rowSpan = condition ? rowLength : 0;
  return {
    rowSpan,
  };
};
