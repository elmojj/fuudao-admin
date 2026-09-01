export const BOX_ERROR = {
  LOCKED_BY_OTHER: 40001,
  SOLD: 40002,
  MAX_SELECT: 40003,
  BAG_INVALID: 40004,
} as const;

export const BOX_LOCK_TTL_MS = 180_000;
export const BOX_MAX_SELECT = 10;

export type IBoxLockInfo = {
  boxNo: number;
  userId: string;
  userName?: string;
  lockedAt: string;
};

export type IBoxState = {
  bagId: string;
  soldBoxes: number[];
  locks: IBoxLockInfo[];
};

export type BoxWsMessage =
  | { type: 'state:snapshot'; data: IBoxState }
  | { type: 'box:lock'; data: IBoxLockInfo }
  | { type: 'box:unlock'; data: { boxNo: number; userId: string } }
  | { type: 'box:sold'; data: { boxNos: number[] } }
  | { type: 'pong' };
