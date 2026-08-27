'use client';

import { message } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  LoginResponse,
  getCaptcha,
  onLoginSuccess,
  requestLogin,
} from 'src/app/request/login';
import { baseActions, useBaseSlice } from 'src/app/store/base';
import { useThemeSlice } from 'src/app/store/theme';
import Login from 'src/components/login';
import { useAppNavigate } from 'src/utils/app-navigation';

export default function LoginWrap() {
  useBaseSlice();
  useThemeSlice();

  const navigate = useAppNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState<boolean>(false);
  const dispatch = useDispatch();

  const login = async (username: string, password: string, captcha: string) => {
    try {
      setLoading(true);
      const response: LoginResponse = await requestLogin(
        username,
        password,
        captcha,
      );
      if (response.status === 'Success') {
        onLoginSuccess(response);
        navigate('/panel/dashboard');
      } else {
        console.log(response.errorMessage);
        messageApi.error(response.errorMessage, 3);
      }
    } finally {
      setLoading(false);
    }
  };

  const getCaptchaMethod = async () => {
    const a = await getCaptcha();
    if (a.status === 'Success') {
      return a.url;
    }
    return undefined;
  };

  useEffect(() => {
    dispatch(baseActions.signOutResetSaga());
  }, [dispatch]);

  return (
    <div>
      <Login onFinish={login} loading={loading} getCaptcha={getCaptchaMethod} />
      {contextHolder}
    </div>
  );
}
