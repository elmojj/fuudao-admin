import { QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Dropdown, Space } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useOutlet, useParams } from 'react-router';
import { SYSTEM_CONFIG, SYSTEM_ICON_BASE_PATH } from 'src/config';
import AboutWindow from '../core/about/loadable';
import { selectLayoutMainLoading } from '../store/base/selectors';
import { useThemeSlice } from '../store/theme';
import { selectTheme } from '../store/theme/selector';
import { LayoutMainContentWrapper, LayoutMainHeaderWrapper } from './style';
import { baseActions } from '../store/base';

const LayoutMain = () => {
  useThemeSlice();
  const navigate = useNavigate();

  const theme = useSelector(selectTheme);
  const dispatch = useDispatch();

  const outlet = useOutlet();
  const { hiddenLayout } = useParams();

  const loading = useSelector(selectLayoutMainLoading);

  const [showAboutWindow, setShowAboutWindow] = useState<boolean>(false);
  const aboutWindowLoadingRef = useRef<boolean>(false);

  const items = [
    {
      key: 'about',
      onClick: () => {
        aboutWindowLoadingRef.current = true;
        setShowAboutWindow(true);
      },
      label: '版本信息',
    },
  ];

  useEffect(() => {
    const isInitialPassword = localStorage.getItem('isInitialPassword');
    if (isInitialPassword) {
      navigate('/');
    }
    dispatch(baseActions.initializeLayoutMainSaga());
  }, []);

  return (
    <>
      {!hiddenLayout ? (
        <LayoutMainHeaderWrapper>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <img
              style={{ height: '45px' }}
              alt={SYSTEM_CONFIG.systemName}
              src={`${SYSTEM_ICON_BASE_PATH}${SYSTEM_CONFIG.logoImage}-${theme}`}
            />
          </div>
          <div style={{ flex: '1 0 auto' }}>
            {/* <Menu items={menuList} /> */}
          </div>
          <Space>
            <Dropdown menu={{ items }}>
              <Button type="link">
                <QuestionCircleOutlined style={{ fontSize: '24px' }} />
              </Button>
            </Dropdown>
          </Space>
        </LayoutMainHeaderWrapper>
      ) : null}
      {aboutWindowLoadingRef.current && (
        <AboutWindow
          showAboutWindow={showAboutWindow}
          close={() => setShowAboutWindow(false)}
        />
      )}
      <LayoutMainContentWrapper hiddenLayout={hiddenLayout}>
        {loading ? null : outlet}
      </LayoutMainContentWrapper>
      {SYSTEM_CONFIG.showWatermark ? (
        <img
          className="app-logo"
          src={`${SYSTEM_ICON_BASE_PATH}${SYSTEM_CONFIG.watermarkImage}`}
          alt={SYSTEM_CONFIG.watermarkImage}
        />
      ) : null}
    </>
  );
};

LayoutMain.displayName = 'LayoutMain';

export default LayoutMain;
