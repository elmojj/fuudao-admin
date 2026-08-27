import { handleFileUpload } from 'src/server/dispatch';
import { mallOk } from 'src/server/mall-response';

export async function POST(request: Request) {
  const res = await handleFileUpload(request);
  const json = await res.json();
  if (json.code !== 200) {
    return Response.json({ code: 1, data: null, message: json.message });
  }
  return mallOk({ url: json.data });
}
