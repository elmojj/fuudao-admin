import {
  cancelBagOrder,
  createBagOrder,
  getBagOrder,
  handleWechatPayNotify,
  openBagOrder,
  payBagOrder,
} from '../../bag-order/bag-order-service';

export async function handleBagOrderCreate(
  userId: string,
  body: Record<string, unknown>,
) {
  const bagId = String(body.bagId || '');
  const boxNos = Array.isArray(body.boxNos)
    ? body.boxNos.map(Number)
    : [];
  if (!bagId) return { code: 1, message: 'bagId 不能为空' };
  return createBagOrder({ userId, bagId, boxNos });
}

export async function handleBagOrderDetail(userId: string, orderId: string) {
  return getBagOrder(orderId, userId);
}

export async function handleBagOrderPay(userId: string, orderId: string) {
  return payBagOrder(orderId, userId);
}

export async function handleBagOrderCancel(userId: string, orderId: string) {
  return cancelBagOrder(orderId, userId);
}

export async function handleBagOrderOpen(userId: string, orderId: string) {
  return openBagOrder(orderId, userId);
}

export async function handleBagOrderWechatNotify(body: Record<string, unknown>) {
  return handleWechatPayNotify(body);
}
