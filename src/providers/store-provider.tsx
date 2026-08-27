'use client';

import { Provider } from 'react-redux';
import store from 'src/app/store/configure-store';

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Provider store={store}>{children}</Provider>;
}
