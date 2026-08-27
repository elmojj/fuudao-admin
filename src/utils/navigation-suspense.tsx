'use client';

import { Suspense } from 'react';

function NavigationStateReader({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

export function NavigationSuspense({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

export default NavigationStateReader;
