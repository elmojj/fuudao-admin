const bagQueues = new Map<string, Promise<unknown>>();

/** 同一福袋串行处理抽奖任务 */
export function enqueueBagTask<T>(
  bagId: string,
  task: () => Promise<T>,
): Promise<T> {
  const prev = bagQueues.get(bagId) || Promise.resolve();
  const next = prev
    .catch(() => undefined)
    .then(task);
  bagQueues.set(bagId, next);
  return next as Promise<T>;
}
