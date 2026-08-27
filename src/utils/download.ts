/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import dayjs from 'dayjs';
import { utils, write, writeFile, writeFileXLSX } from 'xlsx';

type PaginationType = {
  current: number;
  pageSize: number;
};

export function convertListForExport(
  data: Record<string, any>[],
  columns: any[],
): Record<string, any>[] {
  return data.map((row) => {
    const exportItem: Record<string, any> = {};
    columns.forEach((column) => {
      if (
        ['序号', '操作', undefined].includes(column.title) ||
        ['operation', 'index'].includes(column.dataIndex)
      )
        return;
      const value = row[column.dataIndex];
      let renderText = value;
      if (
        column.renderText &&
        typeof column.renderText(value, row) === 'string'
      ) {
        renderText = column.renderText(value, row);
      } else if (
        column.render &&
        typeof column.render(value, row) === 'string'
      ) {
        renderText = column.render(value, row);
      }
      exportItem[column.title] = renderText;
    });
    return exportItem;
  });
}

export function downloadExcel(
  data: Record<string, any>[],
  filename: string,
  excelFormat: 'xlsx' | 'csv' = 'xlsx',
) {
  const ws = utils.json_to_sheet(data);
  const wb = utils.book_new();

  utils.book_append_sheet(wb, ws, 'Sheet1');

  if (excelFormat === 'csv') {
    write(wb, { bookType: 'csv', type: 'buffer' });
    writeFile(wb, `${filename}.csv`);
  } else {
    writeFileXLSX(wb, `${filename}.xlsx`);
  }
}

export function onExportByFilterPage(
  list: Record<string, any>[],
  columns: any[],
  pagination: PaginationType,
  filename: string,
  isAlreadyPaginated: boolean = false,
) {
  if (!list || list.length === 0 || (!isAlreadyPaginated && !pagination)) {
    return;
  }

  const exportData = isAlreadyPaginated
    ? convertListForExport(list, columns)
    : convertListForExport(
        list.slice(
          (pagination.current - 1) * pagination.pageSize,
          pagination.current * pagination.pageSize,
        ),
        columns,
      );

  downloadExcel(
    exportData,
    `${filename}导出_${dayjs().format('YYYYMMDDHHmmss')}`,
  );
}
