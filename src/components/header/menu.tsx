/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { Menu as AntdMenu, MenuProps } from 'antd';
import { useEffect, useState } from 'react';
import { useMatches, useNavigate } from 'react-router';
import {
  MENU_TYPE_MENU,
  MENU_TYPE_PAGE,
  MENU_TYPE_URLMENU,
  MenuInfoItem,
  convertMenuData,
  getMenuItemFromKeyPath,
  getMenuItemFromRoute,
} from 'src/data/menu-data';

interface Props {
  items: MenuProps['items'];
}

const Menu = (props: Props) => {
  const { items } = props;
  const [currentKey, setCurrentKey] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  const matches = useMatches();

  const onClick: MenuProps['onClick'] = (e) => {
    const menuInfo = getMenuItemFromKeyPath(
      items as MenuInfoItem[],
      e.keyPath.reverse(),
    );
    if (menuInfo) {
      const { path, key, type, url } = menuInfo;
      if (type === MENU_TYPE_PAGE || type === MENU_TYPE_MENU) {
        navigate(path, {
          state: {
            menuId: key,
          },
        });
      }

      if (type === MENU_TYPE_URLMENU && url) {
        let openUrl = url;
        const matchHttp = url.match(/^[https|http]/);
        if (matchHttp === null) openUrl = `http://${openUrl}`;
        navigate(`/main/iframe?url=${openUrl}`);
      }
    }
  };

  useEffect(() => {
    const pathNames = matches.map((item) => item.pathname);
    const menuItem = getMenuItemFromRoute(items as MenuInfoItem[], pathNames);

    setCurrentKey(menuItem?.key);
  }, [items, matches]);

  return (
    <AntdMenu
      style={{ border: 'none' }}
      selectedKeys={currentKey ? [currentKey] : undefined}
      onClick={onClick}
      mode="horizontal"
      items={convertMenuData(items as MenuInfoItem[])}
    />
  );
};

Menu.displayName = 'Menu';

export default Menu;
