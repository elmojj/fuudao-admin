/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

export interface ServerInfo {
  id: string;
  totalMemory: string;
  usedMemory: string;
  cpuLoad: string;
  updateTime: string;
}

export interface SystemInfo {
  id: string;
  state: string;
  startTime: string;
  executeTime: string;
  duration: string;
}
