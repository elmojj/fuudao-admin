import { CrownFilled, GiftOutlined, SmileFilled, TabletFilled } from '@ant-design/icons';

export default {
  route: {
    path: '/',
    routes: [
      {
        path: '/panel/dashboard',
        name: '数据概览',
        icon: <SmileFilled />,
      },
      {
        name: '抽赏运营',
        icon: <GiftOutlined />,
        path: '/gachaManagement',
        routes: [
          { path: '/gachaManagement/poolList', name: '赏池管理', icon: <CrownFilled /> },
          { path: '/gachaManagement/itemList', name: '赏品管理', icon: <CrownFilled /> },
          { path: '/gachaManagement/drawLogList', name: '抽赏记录', icon: <CrownFilled /> },
          { path: '/gachaManagement/chanceLogList', name: '次数流水', icon: <CrownFilled /> },
          { path: '/gachaManagement/scoreLogList', name: '积分流水', icon: <CrownFilled /> },
          { path: '/gachaManagement/rankSnapshotList', name: '排行榜快照', icon: <CrownFilled /> },
        ],
      },
      // {
      //   path: '/panel',
      //   name: '管理页',
      //   icon: <CrownFilled />,
      //   access: 'canAdmin',
      //   routes: [
      //     {
      //       path: '/panel/saleLotteryDetail',
      //       name: '售出赏品明细',
      //       icon: 'https://gw.alipayobjects.com/zos/antfincdn/upvrAjAPQX/Logo_Tech%252520UI.svg',
      //     },
      //     {
      //       path: '/panel/saleBagDetail',
      //       name: '售出福袋明细',
      //       icon: <CrownFilled />,
      //     },
      //   ],
      // },
      {
        name: '物流管理',
        icon: <TabletFilled />,
        path: '/logisticManagement',
        routes: [
          // {
          //   path: '/logisticManagement/waitSendList',
          //   name: '待发货列表',
          //   icon: <CrownFilled />,
          // },
          // {
          //   path: '/logisticManagement/waitSignList',
          //   name: '待签收列表',
          //   icon: <CrownFilled />,
          // },
          {
            path: '/logisticManagement/logisticList',
            name: '物流列表',
            icon: <CrownFilled />,
          },
        ],
      },
      {
        name: '赏品管理',
        icon: <TabletFilled />,
        path: '/lotteryManagement',
        routes: [
          {
            path: '/lotteryManagement/lotteryList',
            name: '赏品库存列表',
            icon: <CrownFilled />,
          },
          {
            path: '/lotteryManagement/bagList',
            name: '福袋列表',
            icon: <CrownFilled />,
          },
          {
            path: '/lotteryManagement/bagCategoryList',
            name: '福袋类别',
            icon: <CrownFilled />,
          },
          {
            path: '/lotteryManagement/lotteryLevelList',
            name: '赏品等级',
            icon: <CrownFilled />,
          },
        ],
      },
      {
        name: '订单管理',
        icon: <TabletFilled />,
        path: '/orderManagement',
        routes: [
          {
            path: '/orderManagement/orderList',
            name: '订单列表',
            icon: <CrownFilled />,
          },
        ],
      },
      {
        name: '用户管理',
        icon: <TabletFilled />,
        path: '/userManagement',
        routes: [
          {
            path: '/userManagement/userList',
            name: '用户列表',
            icon: <CrownFilled />,
          },
        ],
      },
    ],
  },
  location: {
    pathname: '/',
  },
  appList: [
    // {
    //   icon: 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg',
    //   title: 'Ant Design',
    //   desc: '杭州市较知名的 UI 设计语言',
    //   url: 'https://ant.design',
    // },
    // {
    //   icon: 'https://gw.alipayobjects.com/zos/antfincdn/FLrTNDvlna/antv.png',
    //   title: 'AntV',
    //   desc: '蚂蚁集团全新一代数据可视化解决方案',
    //   url: 'https://antv.vision/',
    //   target: '_blank',
    // },
    // {
    //   icon: 'https://gw.alipayobjects.com/zos/antfincdn/upvrAjAPQX/Logo_Tech%252520UI.svg',
    //   title: 'Pro Components',
    //   desc: '专业级 UI 组件库',
    //   url: 'https://procomponents.ant.design/',
    // },
    // {
    //   icon: 'https://img.alicdn.com/tfs/TB1zomHwxv1gK0jSZFFXXb0sXXa-200-200.png',
    //   title: 'umi',
    //   desc: '插件化的企业级前端应用框架。',
    //   url: 'https://umijs.org/zh-CN/docs',
    // },
    // {
    //   icon: 'https://gw.alipayobjects.com/zos/bmw-prod/8a74c1d3-16f3-4719-be63-15e467a68a24/km0cv8vn_w500_h500.png',
    //   title: 'qiankun',
    //   desc: '可能是你见过最完善的微前端解决方案🧐',
    //   url: 'https://qiankun.umijs.org/',
    // },
    // {
    //   icon: 'https://gw.alipayobjects.com/zos/rmsportal/XuVpGqBFxXplzvLjJBZB.svg',
    //   title: '语雀',
    //   desc: '知识创作与分享工具',
    //   url: 'https://www.yuque.com/',
    // },
    // {
    //   icon: 'https://gw.alipayobjects.com/zos/rmsportal/LFooOLwmxGLsltmUjTAP.svg',
    //   title: 'Kitchen ',
    //   desc: 'Sketch 工具集',
    //   url: 'https://kitchen.alipay.com/',
    // },
    // {
    //   icon: 'https://gw.alipayobjects.com/zos/bmw-prod/d3e3eb39-1cd7-4aa5-827c-877deced6b7e/lalxt4g3_w256_h256.png',
    //   title: 'dumi',
    //   desc: '为组件开发场景而生的文档工具',
    //   url: 'https://d.umijs.org/zh-CN',
    // },
  ],
};
