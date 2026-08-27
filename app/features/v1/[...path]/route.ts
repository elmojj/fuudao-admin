import { handleFeaturesV1 } from 'src/server/dispatch';

type Params = { params: { path: string[] } };

async function handler(request: Request, { params }: Params) {
  const path = params.path.join('/');
  return handleFeaturesV1(path, request);
}

export const GET = handler;
export const POST = handler;
