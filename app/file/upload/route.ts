import { handleFileUpload } from 'src/server/dispatch';

export async function POST(request: Request) {
  return handleFileUpload(request);
}
