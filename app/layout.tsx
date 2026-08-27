import type { Metadata } from 'next';
import Script from 'next/script';
import AppProviders from 'src/providers/app-providers';
import { getRuntimeConfig } from 'src/config';

export const metadata: Metadata = {
  title: {
    default: getRuntimeConfig().SYSTEM_CONFIG.systemName,
    template: `%s - ${getRuntimeConfig().SYSTEM_CONFIG.systemName}`,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Script src="/global-config.js" strategy="beforeInteractive" />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
