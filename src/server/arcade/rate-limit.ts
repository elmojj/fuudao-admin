type Bucket = number[];

const buckets = new Map<string, Bucket>();

function getBucket(key: string): Bucket {
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = [];
    buckets.set(key, bucket);
  }
  return bucket;
}

/** 滑动窗口限流，返回 true 表示允许通过 */
export function checkRateLimit(
  key: string,
  maxCount: number,
  windowMs = 1000,
): boolean {
  const now = Date.now();
  const bucket = getBucket(key);
  const valid = bucket.filter((ts) => now - ts < windowMs);
  if (valid.length >= maxCount) {
    buckets.set(key, valid);
    return false;
  }
  valid.push(now);
  buckets.set(key, valid);
  return true;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}
