'use client';

const NAVIGATION_STATE_PREFIX = 'app_navigation_state:';

export function setNavigationState(path: string, state: unknown) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(
    `${NAVIGATION_STATE_PREFIX}${path}`,
    JSON.stringify(state),
  );
}

export function getNavigationState<T = unknown>(path: string): T | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = sessionStorage.getItem(`${NAVIGATION_STATE_PREFIX}${path}`);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function clearNavigationState(path: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(`${NAVIGATION_STATE_PREFIX}${path}`);
}
