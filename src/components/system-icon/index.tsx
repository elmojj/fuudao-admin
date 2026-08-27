/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { Button, Divider, Image, List, Popconfirm, Skeleton } from 'antd';
import { SYSTEM_ICON_BASE_PATH } from 'src/config';
import { SystemIconData } from 'src/data/system-icon';
import {
  DeleteIconWrapper,
  HeaderWrapper,
  IconWrapper,
  SystemIconWrapper,
} from './style';

interface Props {
  iconData: SystemIconData[];
  loading: boolean;
  noMore: boolean;
  openUpload?: () => void;
  children: React.ReactElement;
  handleDelete: (iconName: string) => void;
}

const SystemIcon = (props: Props) => {
  const { iconData, loading, children, openUpload, handleDelete, noMore } =
    props;

  return (
    <SystemIconWrapper>
      <HeaderWrapper>
        <span>图标列表</span>
        <Button type="primary" onClick={() => openUpload?.()}>
          上传图标
        </Button>
      </HeaderWrapper>

      <List
        grid={{
          gutter: 8,
          column: 8,
        }}
        dataSource={iconData}
        renderItem={(item) => (
          <List.Item style={{ padding: 0 }}>
            <IconWrapper>
              <div className="icon-header">
                <div title={item.fileName}>{item.fileName}</div>
                <Popconfirm
                  title="提示"
                  description="此操作将永久删除该图标，是否继续?"
                  onConfirm={() => handleDelete(item.uuid)}
                  okText="是"
                  cancelText="否"
                >
                  <DeleteIconWrapper />
                </Popconfirm>
              </div>
              <Image
                className="image"
                src={`${SYSTEM_ICON_BASE_PATH}${item.fileName}`}
                preview={{
                  src: `${SYSTEM_ICON_BASE_PATH}${item.fileName}`,
                }}
              />
            </IconWrapper>
          </List.Item>
        )}
      />
      {loading ? <Skeleton paragraph={{ rows: 1 }} active /> : null}
      {noMore ? <Divider plain>已经全部加载... 🤐</Divider> : null}
      {children}
    </SystemIconWrapper>
  );
};

SystemIcon.displayName = 'SystemIcon';

export default SystemIcon;
