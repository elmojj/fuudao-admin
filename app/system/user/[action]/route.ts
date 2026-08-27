import { handleSystemUser } from 'src/server/dispatch';

type Params = { params: { action: string } };

export async function GET(request: Request, { params }: Params) {
  return handleSystemUser(params.action, request);
}

export async function POST(request: Request, { params }: Params) {
  return handleSystemUser(params.action, request);
}
