import { handleMallApi } from 'src/server/dispatch-mall';

export const dynamic = 'force-dynamic';

type Params = { params: { path: string[] } };

async function handler(request: Request, { params }: Params) {
  const path = params.path.join('/');
  return handleMallApi(path, request);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
