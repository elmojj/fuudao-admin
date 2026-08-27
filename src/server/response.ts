export function ok(data: unknown = null, message = 'success') {
  return Response.json({ code: 200, data, message });
}

export function fail(message: string, code = 400) {
  return Response.json({ code, data: null, message }, { status: 200 });
}

export function portalOk(values: Record<string, unknown> = {}) {
  return Response.json({ json_ok: true, json_msg: 'success', ...values });
}

export function portalFail(message: string) {
  return Response.json({ json_ok: false, json_msg: message });
}

export async function parseBody<T = Record<string, unknown>>(
  request: Request,
): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

export function parseQuery(url: string) {
  const { searchParams } = new URL(url);
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

export function paginate(page?: number | string, pageSize?: number | string) {
  const limit = Math.max(1, Number(pageSize) || 10);
  const current = Math.max(1, Number(page) || 1);
  const offset = (current - 1) * limit;
  return { limit, offset, current };
}

export function toStr(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function toNumStr(value: unknown): string {
  if (value === null || value === undefined) return '0';
  return String(value);
}

export function formatTime(value: unknown): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function newId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 解析订单/物流状态筛选，支持单值、逗号分隔字符串、数组 */
export function parseStatusFilter(status: unknown): number[] | null {
  if (status === undefined || status === null || status === '') return null;
  if (status === '2,5,7,9') return null;

  let raw: unknown[];
  if (Array.isArray(status)) {
    raw = status;
  } else if (typeof status === 'string' && status.includes(',')) {
    raw = status.split(',');
  } else {
    raw = [status];
  }

  const nums = raw.map((item) => Number(item)).filter((n) => !Number.isNaN(n));
  return nums.length ? nums : null;
}

export function appendStatusCondition(
  column: string,
  status: unknown,
  conditions: string[],
  values: unknown[],
  startIdx: number,
): number {
  const statuses = parseStatusFilter(status);
  if (!statuses) return startIdx;
  if (statuses.length === 1) {
    conditions.push(`${column} = $${startIdx}`);
    values.push(statuses[0]);
  } else {
    conditions.push(`${column} = ANY($${startIdx})`);
    values.push(statuses);
  }
  return startIdx + 1;
}
