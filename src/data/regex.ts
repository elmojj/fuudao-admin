/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

// 11位手机号正则
export const phoneNumberRegex = /^1[0-9]{10}$/;

// 邮箱正则
export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// 密码正则
export const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).*$/;
