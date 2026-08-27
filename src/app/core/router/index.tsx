import { createHashRouter } from 'react-router-dom';
import LoginWrap from 'src/app/core/login';
import LoginDirect from 'src/app/core/login/auto-login';
import LayoutMain from 'src/app/layout';
import LogisticList from 'src/app/pages/logistic-list';
import BagCategoryList from 'src/app/pages/lotteryManagement/bagCategoryList';
import BagList from 'src/app/pages/lotteryManagement/bagList';
import CreateBag from 'src/app/pages/lotteryManagement/create-bag';
import LotteryLevelList from 'src/app/pages/lotteryManagement/lottery-level';
import LotteryList from 'src/app/pages/lotteryManagement/lottery-list';
import OrderList from 'src/app/pages/order-management/order-list';
// import LayoutMain from 'src/app/layout/layout-main';
import Dashboard from 'src/app/pages/panel/dashboard';
import UserList from 'src/app/pages/user-management/user-list';
import UserDetail from 'src/app/pages/user-management/user-detail';

const webRoutes = createHashRouter([
  {
    path: '/',
    children: [
      { index: true, element: <LoginWrap /> },
      {
        path: 'login',
        element: <LoginWrap />,
      },
      {
        path: 'autoLogin',
        element: <LoginDirect />,
      },
      {
        path: 'panel',
        element: <LayoutMain />,
        children: [
          {
            index: true,
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'saledLotteryDetail',
            element: <Dashboard />,
          },
          {
            path: 'saledBagDetail',
            element: <Dashboard />,
          },
        ],
      },
      {
        path: 'logisticManagement',
        element: <LayoutMain />,
        children: [
          {
            index: true,
            path: 'waitSendList',
            element: <Dashboard />,
          },
          {
            path: 'waitSignList',
            element: <Dashboard />,
          },
          {
            path: 'logisticList',
            element: <LogisticList />,
          },
        ],
      },
      {
        path: 'lotteryManagement',
        element: <LayoutMain />,
        children: [
          {
            index: true,
            path: 'lotteryList',
            element: <LotteryList />,
          },
          {
            path: 'bagList',
            element: <BagList />,
          },
          {
            path: 'bagCategoryList',
            element: <BagCategoryList />,
          },
          {
            path: 'lotteryLevelList',
            element: <LotteryLevelList />,
          },
          {
            path: 'createBag',
            element: <CreateBag />,
          },
        ],
      },
      {
        path: 'orderManagement',
        element: <LayoutMain />,
        children: [
          {
            index: true,
            path: 'orderList',
            element: <OrderList />,
          },
        ],
      },
      {
        path: 'userManagement',
        element: <LayoutMain />,
        children: [
          {
            index: true,
            path: 'userList',
            element: <UserList />,
          },
          {
            path: 'userDetail',
            element: <UserDetail />,
          },
        ],
      },
    ],
  },
]);

const routes = webRoutes;

export default routes;
