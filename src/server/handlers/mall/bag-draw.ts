import { executeBagDraw } from '../../bag/bag-draw-service';

export async function handleBagDraw(
  userId: string,
  body: Record<string, unknown>,
) {
  const bagId = String(body.bagId || '');
  const boxNos = Array.isArray(body.boxNos)
    ? body.boxNos.map(Number)
    : [];
  return executeBagDraw(userId, bagId, boxNos);
}
