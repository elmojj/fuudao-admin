'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import {
  getNavigationState,
  setNavigationState,
} from './navigation-state';

type NavigateOptions = {
  state?: unknown;
};

export function useAppNavigate() {
  const router = useRouter();

  return (to: string | number, options?: NavigateOptions) => {
    if (typeof to === 'number') {
      if (to === -1) {
        router.back();
      }
      return;
    }

    const normalizedPath = to.startsWith('/') ? to : `/${to}`;

    if (options?.state !== undefined) {
      setNavigationState(normalizedPath, options.state);
    }

    router.push(normalizedPath);
  };
}

export function useAppLocation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = useMemo(() => {
    const query = searchParams.toString();
    return query ? `?${query}` : '';
  }, [searchParams]);

  const state = useMemo(
    () => getNavigationState(pathname),
    [pathname],
  );

  return {
    pathname,
    search,
    state,
  };
}
