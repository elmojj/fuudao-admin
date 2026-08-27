/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import RequestQueue, { RequestOption } from '../request-queue';

describe('request-queue', () => {
  const requestQueue = new RequestQueue();
  it('request-queue - debounce task request', () => {
    const requestDemoArray = [
      {
        path: 'abc',
        hashKey: 'aaa',
      },
      {
        path: 'abc',
        hashKey: 'aaa',
      },
      {
        path: 'abc',
        hashKey: 'aaa',
      },
      {
        path: 'abc',
        hashKey: 'bbb',
      },
    ];
    requestDemoArray.forEach((item) => {
      if (!requestQueue.isRequestTaskPending(item.path, item.hashKey)) {
        expect(
          requestQueue.isRequestTaskPending(item.path, item.hashKey),
        ).toEqual(false);
        requestQueue.setRequestTask(item.path, item.hashKey);
        setTimeout(() => {
          requestQueue.removeRequestTask(item.path, item.hashKey);
        }, 5000);
      } else {
        expect(
          requestQueue.isRequestTaskPending(item.path, item.hashKey),
        ).toEqual(true);
      }
    });

    requestQueue.removeRequestTask('abc', 'aaa');
    requestQueue.removeRequestTask('abc', 'bbb');
    // expect(requestQueue._requestTaskMap).toEqual({ abc: new Set() });
  });

  it('request-queue - debounce job request', () => {
    const requestDemoArray: { path: string; hashKey: string; option: any }[] = [
      {
        path: 'abc',
        hashKey: 'aaa',
        option: 'aaaaaa',
      },
      {
        path: 'abc',
        hashKey: 'aaa',
        option: 'aaaaaa',
      },
      {
        path: 'abc',
        hashKey: 'bbb',
        option: 'bbbbbb',
      },
      {
        path: 'abc',
        hashKey: 'ccc',
        option: 'cccccc',
      },
      {
        path: 'abc',
        hashKey: 'ddd',
        option: 'dddddd',
      },
    ];
    requestDemoArray.forEach((item) => {
      if (!requestQueue.isRequestTaskPending(item.path, item.hashKey)) {
        expect(
          requestQueue.isRequestTaskPending(item.path, item.hashKey),
        ).toEqual(false);
        requestQueue.setRequestJob(
          item.path,
          item.hashKey,
          item.option as RequestOption,
        );
        setTimeout(() => {
          requestQueue.removeRequestJob(item.path, item.hashKey);
        }, 15000);
      }
    });
    // expect(requestQueue._requestJobMap).toEqual({
    //   abc: ['aaa', 'ddd'],
    // });
    // expect(requestQueue.requestOptionMap).toEqual(new Map([['ddd', 'dddddd']]));

    const nextRequest = requestQueue.removeRequestJob('abc', 'aaa');
    // expect(requestQueue._requestJobMap).toEqual({ abc: ['ddd'] });

    expect(nextRequest).toEqual('dddddd');

    const nextRequest2 = requestQueue.removeRequestJob('abc', 'ddd');
    expect(nextRequest2).toEqual(undefined);

    const nextRequest3 = requestQueue.removeRequestJob('abc1', 'ddd');
    expect(nextRequest3).toEqual(undefined);
  });
});
