export function mallOk(data: unknown = null, message = 'success') {
  return Response.json({ code: 0, data, message });
}

export function mallFail(message: string, code = 1, httpStatus = 200) {
  return Response.json({ code, data: null, message }, { status: httpStatus });
}

export function mallPaginate(
  page?: number | string,
  size?: number | string,
  limitParam?: number | string,
) {
  const pageSize = Math.max(1, Number(size || limitParam) || 10);
  const current = Math.max(1, Number(page) || 1);
  const offset = (current - 1) * pageSize;
  return { limit: pageSize, offset, current, size: pageSize };
}

export const ORDER_STATUS_TO_DB: Record<string, number> = {
  PENDING: 1,
  PAID: 2,
  SHIPPED: 7,
  COMPLETED: 9,
  CANCELLED: 4,
};

export const ORDER_STATUS_FROM_DB: Record<number, string> = {
  1: 'PENDING',
  2: 'PAID',
  3: 'PENDING',
  4: 'CANCELLED',
  5: 'PAID',
  6: 'PENDING',
  7: 'SHIPPED',
  8: 'CANCELLED',
  9: 'COMPLETED',
};

export function parseOrderStatusFilter(status: unknown): number[] | null {
  if (status === undefined || status === null || status === '') return null;
  if (Array.isArray(status)) {
    const nums = status
      .map((s) => ORDER_STATUS_TO_DB[String(s)] ?? Number(s))
      .filter((n) => !Number.isNaN(n));
    return nums.length ? nums : null;
  }
  if (typeof status === 'string' && status.includes(',')) {
    const nums = status
      .split(',')
      .map((s) => ORDER_STATUS_TO_DB[s.trim()] ?? Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    return nums.length ? nums : null;
  }
  const mapped = ORDER_STATUS_TO_DB[String(status)];
  if (mapped !== undefined) return [mapped];
  const num = Number(status);
  return Number.isNaN(num) ? null : [num];
}
