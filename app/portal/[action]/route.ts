import { handlePortal } from 'src/server/dispatch';

type Params = { params: { action: string } };

export async function POST(request: Request, { params }: Params) {
  return handlePortal(params.action, request);
}
