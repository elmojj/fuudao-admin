export const BAG_DRAW_ERROR = {
  NOT_ENOUGH_CHANCES: 40001,
  BOX_SOLD: 40002,
  BAG_INVALID: 40004,
  BOX_NOT_LOCKED: 40005,
} as const;

export type IBagDrawPrize = {
  boxNo: number;
  prizeName: string;
  prizeImage?: string;
  grade?: string;
  itemId?: string;
  rarity?: string;
  isNew?: boolean;
  isDuplicate?: boolean;
  fragmentsGained?: number;
  scoreGained?: number;
  luckyGained?: number;
};

export type IBagDrawResult = {
  batchId: string;
  bagId: string;
  boxNos: number[];
  balance: number;
  prizes: IBagDrawPrize[];
  totalScore?: number;
};
