import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const LoginDirect = nextDynamic(() => import('src/app/core/login/auto-login'), {
  ssr: false,
});

export default function AutoLoginPage() {
  return <LoginDirect />;
}
