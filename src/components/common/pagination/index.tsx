/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { Pagination, PaginationProps, TablePaginationConfig } from 'antd';

export const CommonPagination = (props: PaginationProps) => (
  <Pagination
    showSizeChanger
    showQuickJumper
    showTotal={(total) => `共 ${total} 条`}
    {...props}
  />
);

export const tablePaginationConfig: false | TablePaginationConfig = {
  showQuickJumper: true,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
};
