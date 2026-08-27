/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { Reducer, UnknownAction } from '@reduxjs/toolkit';
import { SagaInjectionModes } from 'redux-injectors';
import { Saga } from 'redux-saga';
import { RootState } from 'src/app/store/root-state';

type RequiredRootState = Required<RootState>;
export type RootStateKeyType = keyof RootState;

export type InjectedReducersType = {
  [P in RootStateKeyType]?: Reducer<RequiredRootState[P], UnknownAction>;
};
export interface InjectReducerParams<Key extends RootStateKeyType> {
  key: Key | string;
  reducer: Reducer<RequiredRootState[Key], UnknownAction>;
}

export interface InjectSagaParams {
  key: RootStateKeyType;
  saga: Saga;
  mode?: SagaInjectionModes;
}
