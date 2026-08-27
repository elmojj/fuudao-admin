import { SagaReturnType, all, call, put, takeLatest } from 'redux-saga/effects';
import getBagList, { GetBagListType } from 'src/app/request/bag-list';
import { GetDeliveryList } from 'src/app/request/logistic-list';
import getLotteryList, {
  GetLotteryListType,
  getLotteryLevelList,
} from 'src/app/request/lottery-list';
import { baseActions } from '.';

function* resetStateSaga() {
  yield put(baseActions.resetState());
}

function* signOutResetSaga() {
  yield resetStateSaga();
}

function* initializeLayoutMain() {
  try {
    const [
      bagListResponse,
      lotteryListResponse,
      levelListResponse,
      deliveryListResponse,
    ]: [
      SagaReturnType<typeof getBagList>,
      SagaReturnType<typeof getLotteryList>,
      SagaReturnType<typeof getLotteryLevelList>,
      SagaReturnType<typeof GetDeliveryList>,
    ] = yield all([
      call(getBagList, { pageSize: 50000, current: 1 }),
      call(getLotteryList, { pageSize: 50000, current: 1 }),
      call(getLotteryLevelList, { pageSize: 50000, current: 1 }),
      call(GetDeliveryList),
    ]);

    const { list: bagList } = bagListResponse;
    const { list: lotteryList } = lotteryListResponse;
    const { list: levelList } = levelListResponse;
    const { list: deliveryList } = deliveryListResponse;
    const lotteryListMap: { [key: string]: GetLotteryListType } = {};
    lotteryList.forEach((item) => {
      lotteryListMap[item.productName] = item;
    });
    yield put(
      baseActions.updateLayoutMainLoading({
        loading: false,
      }),
    );
    const bagListMap: { [key: string]: GetBagListType } = {};
    bagList.forEach((item) => {
      bagListMap[item.id] = item;
    });
    yield put(
      baseActions.updateBagMap({
        bagListMap,
      }),
    );
    yield put(
      baseActions.updateLotteryMap({
        lotteryListMap,
      }),
    );
    yield put(
      baseActions.updateLotteryLevelList({
        lotteryLevelList: levelList,
      }),
    );
    yield put(
      baseActions.updateDeliveryList({
        deliveryList,
      }),
    );
  } catch (err) {
    console.log('initializeLayoutMain error', err);
  }
}

// eslint-disable-next-line import/prefer-default-export
export function* baseSaga() {
  yield takeLatest(baseActions.resetStateSaga, resetStateSaga);
  yield takeLatest(baseActions.signOutResetSaga, signOutResetSaga);
  yield takeLatest(baseActions.initializeLayoutMainSaga, initializeLayoutMain);
}
