/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { Button, Space, Tag, TagProps, Tooltip } from 'antd';
import { ButtonType } from 'antd/es/button';
import { ReactNode } from 'react';
import { SpecificPrefixH2 } from 'src/styles/common-style';
import {
  ButtonsWrapper,
  FormTitle,
  FormTitleWrapper,
} from '../../form-table/style';

export interface ButtonConfig {
  label: string;
  callback: () => void | Promise<void>;
  mode?: 'iconOrLabel' | 'iconAndLabel';
  type?: ButtonType | 'danger';
  disabled?: boolean;
  icon?: ReactNode;
  size?: 'large' | 'middle' | 'small';
  hidden?: boolean;
  tooltip?: boolean;
}

interface TitleStateTagsProps {
  total?: number;
  countArr?: {
    state: string;
    count: number;
    color: TagProps['color'];
  }[];
}

export const TitleStateTags: React.FC<TitleStateTagsProps> = ({
  total,
  countArr,
}) => (
  <Space>
    <Tag>全部: {total ?? 0}</Tag>
    {countArr?.map(({ state, count, color }) => (
      <Tag key={state} color={color}>
        {state}: {count ?? 0}
      </Tag>
    ))}
  </Space>
);

export interface HSSearchTitleProps {
  title: string;
  titleExtras?: ReactNode;
  buttons?: ButtonConfig[];
  style?: React.CSSProperties;
}

const HSSearchTitle: React.FC<HSSearchTitleProps> = ({
  title,
  titleExtras,
  buttons,
  style,
}) => (
  <FormTitleWrapper style={style}>
    <SpecificPrefixH2>
      <FormTitle>{title}</FormTitle>
      {titleExtras}
    </SpecificPrefixH2>
    <ButtonsWrapper>
      {buttons?.map(
        ({
          label,
          callback,
          type,
          disabled,
          icon,
          size,
          hidden,
          tooltip,
          mode = 'iconOrLabel',
        }) => {
          if (hidden) return null;

          const renderBtn = (
            <Button
              key={label}
              onClick={callback}
              danger={type === 'danger'}
              type={type !== 'danger' ? type : undefined}
              disabled={disabled}
              style={{ marginRight: 10 }}
              size={size}
            >
              {mode === 'iconOrLabel' ? (
                icon || label
              ) : (
                <>
                  <span>{icon}</span>
                  <span>{label}</span>
                </>
              )}
            </Button>
          );

          return tooltip ? (
            <Tooltip title={label} key={label}>
              {renderBtn}
            </Tooltip>
          ) : (
            renderBtn
          );
        },
      )}
    </ButtonsWrapper>
  </FormTitleWrapper>
);

export default HSSearchTitle;
