export const BAG_ORDER_PAY_WINDOW_MS = 5 * 60 * 1000;
export const BAG_ORDER_LOCK_KIND_SELECT = 1;
export const BAG_ORDER_LOCK_KIND_ORDER = 2;

export const BAG_ORDER_STATUS = {
  PENDING: 1,
  PAID: 2,
  CANCELLED: 4,
  EXPIRED: 10,
  COMPLETED: 9,
} as const;

export const BAG_ORDER_ERROR = {
  LOCKED_BY_OTHER: 40001,
  SOLD: 40002,
  NO_BOXES: 40003,
  BAG_INVALID: 40004,
} as const;

export type BagOrderStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';

export type IBagOrder = {
  id: string;
  orderNo: string;
  bagId: string;
  bagName: string;
  bagImage?: string;
  boxNos: number[];
  unitPrice: number;
  totalAmount: number;
  status: BagOrderStatus;
  expireAt: string;
  createdAt: string;
  paidAt?: string;
};

export type IWechatPayParams = {
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: 'RSA' | 'MD5';
  paySign: string;
};

export type IBagOrderOpenResult = {
  orderId: string;
  boxNos: number[];
  prizes: {
    boxNo: number;
    prizeName: string;
    prizeImage?: string;
    grade?: string;
  }[];
};
