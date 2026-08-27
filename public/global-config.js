window.HSConfig = {
  HSWEBSERVER:
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000') +
    '/',
  loginValidation: true,
  APPNAME: 'SUPPLY_SCHEDULING',
  SYSTEM_CONFIG: {
    systemName: '富游岛后台',
    systemSubTitle: '富游岛管理后台',
    systemSubTitleColor: '#fff',
    showWatermark: false,
    watermarkImage: 'system-watermark',
    logoImage: 'system-logo',
    loginLogoImage: 'login-logo',
    loginBackgroundImage: 'login-background',
    appLoginBackgroundImage: 'app-login-background',
  },
  weComAgentId: 1000003,
};
