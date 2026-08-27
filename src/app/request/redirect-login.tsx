import { hostApp } from '../host-app';

export default function RedirectToLogin() {
  if (typeof window === 'undefined') return;
  window.location.href = hostApp().loginPage;
}
