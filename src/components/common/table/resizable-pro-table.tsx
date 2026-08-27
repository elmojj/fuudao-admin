/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import {
  ProColumns,
  ProTable,
  ProTableProps,
} from '@ant-design/pro-components';
import { TableColumnsType } from 'antd';
import { useState } from 'react';
import type { ResizeCallbackData } from 'react-resizable';
import { Resizable } from 'react-resizable';
import { ResizableHandle } from './style';

const ResizableTitle = (
  props: React.HTMLAttributes<any> & {
    onResize: (
      e: React.SyntheticEvent<Element>,
      data: ResizeCallbackData,
    ) => void;
    width: number;
  },
) => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <ResizableHandle
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

export type HSResizableTableProps = {
  columns: ProColumns[];
} & Omit<ProTableProps<any, any, any>, 'columns'>;

export const HSResizableProTable = ({
  columns,
  ...props
}: HSResizableTableProps) => {
  const [cols, setCols] = useState<ProColumns[]>(columns);

  const handleResize: Function =
    (index: number) =>
    (_: React.SyntheticEvent<Element>, { size }: ResizeCallbackData) => {
      const newColumns = [...cols];
      const defaultWidth = 100;
      if (size.width < defaultWidth) return;

      newColumns[index] = {
        ...newColumns[index],
        width: size.width > defaultWidth ? size.width : defaultWidth,
      };
      setCols(newColumns);
    };

  const mergeColumns: ProColumns<any>[] = cols.map((col, index) => ({
    ...col,
    onHeaderCell: (column: TableColumnsType[number]) => ({
      width: column.width,
      onResize: handleResize(index) as React.ReactEventHandler<any>,
    }),
  }));

  return (
    <ProTable
      bordered
      components={{
        header: {
          cell: ResizableTitle,
        },
      }}
      size="small"
      columns={mergeColumns}
      options={{
        reload: false,
        density: false,
        setting: {
          draggable: true,
          checkable: true,
          showListItemOption: true,
        },
      }}
      {...props}
    />
  );
};
