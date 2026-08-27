'use client';

import { LoadingOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import { hostApp } from 'src/app/host-app';
import { LoginResponse, onLoginSuccess } from 'src/app/request/login';
import { UrlParams, getUrlParams } from 'src/app/request/url-params';
import { useAppNavigate } from 'src/utils/app-navigation';

function LoginDirect() {
  const navigate = useAppNavigate();

  const appLogin = async () => {
    const urlParams: UrlParams = getUrlParams(window.location.search);
    const token = urlParams.token ? urlParams.token : '';
    const { app } = urlParams;
    if (app) {
      hostApp().loginPage = '/app404';
    }
    if (token) {
      const response: LoginResponse = {
        status: 'Success',
        sessionId: token,
      };
      onLoginSuccess(response);
      navigate('/panel/dashboard');
    } else if (app) {
      navigate(hostApp().loginPage, {
        state: {
          message: '该用户无权限访问!',
        },
      });
    } else {
      navigate(hostApp().loginPage);
    }
  };

  useEffect(() => {
    appLogin();
  }, []);

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <LoadingOutlined />
    </div>
  );
}

export default LoginDirect;
