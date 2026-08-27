import { handleLogout } from 'src/server/dispatch';

export async function POST() {
  return handleLogout();
}
