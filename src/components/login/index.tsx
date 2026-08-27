/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

'use client';

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Col, Form, Image, Input, Row } from 'antd';
import { useEffect, useState } from 'react';
import { LOGIN_VALIDATION, SYSTEM_CONFIG } from 'src/config';
import { AppMode } from 'src/data/app-config';
import useToken from 'src/styles/use-token';
import { LoginWrapper } from './style';

export interface Props {
  onFinish: (username: string, password: string, captcha: string) => void;
  loading?: boolean;
  appMode?: AppMode;
  getCaptcha?: () => Promise<string | undefined>;
}

const Login = (props: Props) => {
  const { onFinish, loading, appMode, getCaptcha } = props;

  const { token } = useToken();
  const [randomString, setRandomString] = useState<string>('');
  const { systemName, systemSubTitleColor, systemSubTitle } = SYSTEM_CONFIG;

  const updateRandomCode = async () => {
    getCaptcha?.().then((url) => {
      setRandomString(url ?? '');
    });
  };

  const handleFinish = async (values: {
    username: string;
    password: string;
    captcha: string;
  }) => {
    const { username, password, captcha } = values;
    onFinish(username, password, captcha);
    updateRandomCode();
  };

  useEffect(() => {
    updateRandomCode();
  }, []);

  return (
    <LoginWrapper appMode={appMode}>
      <div className="login-content">
        <div className="logo">
          <img
            alt={systemName}
            src="https://src.fuudao.cn/icon/companyLogo.png"
            style={{ maxWidth: '80vw' }}
          />
        </div>
        <div
          className="login-subtitle"
          style={{
            color: systemSubTitleColor || token.colorText,
          }}
        >
          {systemSubTitle}
        </div>
        <Form
          size="large"
          name="loginForm"
          onFinish={handleFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          {LOGIN_VALIDATION ? (
            <Form.Item>
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item
                    name="captcha"
                    noStyle
                    rules={[
                      {
                        required: true,
                        message: '请输入验证码',
                      },
                    ]}
                  >
                    <Input placeholder="验证码" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Button onClick={updateRandomCode}>
                    <Image height="100%" src={randomString} preview={false} />
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          ) : null}

          <Form.Item>
            <Button
              loading={loading}
              style={{ width: '100%' }}
              type="primary"
              htmlType="submit"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </LoginWrapper>
  );
};

Login.displayName = 'Login';

export default Login;
