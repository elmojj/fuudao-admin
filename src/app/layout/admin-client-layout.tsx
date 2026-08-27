'use client';

import LayoutMain from 'src/app/layout';

export default function AdminClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutMain>{children}</LayoutMain>;
}
