/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { LabelRect, collisionDetect } from '../label-collision-detect';

describe('label-collision-detect', () => {
  const labelIn1: LabelRect = {
    id: 'in-1',
    x: 1,
    y: 1,
    width: 10,
    height: 10,
    priority: 1,
  };

  const labelOutside: LabelRect = {
    id: 'id-outside',
    x: -1,
    y: 1,
    width: 10,
    height: 10,
    priority: 0,
  };

  const labelIn2: LabelRect = {
    id: 'in-2',
    x: 1,
    y: 1,
    width: 10,
    height: 10,
    priority: 0,
  };

  const labelIn3: LabelRect = {
    id: 'in-3',
    x: 50,
    y: 50,
    width: 10,
    height: 10,
    priority: 1,
  };

  const labelIn4: LabelRect = {
    id: 'in-4',
    x: 50,
    y: 50,
    width: 10,
    height: 10,
    priority: 1,
    visible: true,
  };

  const labelIn5: LabelRect = {
    id: 'in-5',
    x: 80,
    y: 80,
    width: 10,
    height: 10,
    priority: 1,
    visible: true,
  };

  const labelIn6: LabelRect = {
    id: 'in-partialInside',
    x: 95,
    y: 105,
    width: 10,
    height: 10,
    priority: 1,
    visible: true,
  };

  const labelIn7: LabelRect = {
    id: 'bottom-center',
    x: 100,
    y: 120,
    width: 10,
    height: 10,
    priority: 1,
    visible: true,
    positioning: 'bottom-center',
  };

  const labelIn8: LabelRect = {
    id: 'top-center',
    x: 100,
    y: 100,
    width: 10,
    height: 10,
    priority: 1,
    visible: true,
    positioning: 'top-center',
  };
  const labelIn9: LabelRect = {
    id: 'center-right',
    x: 115,
    y: 112.5,
    width: 10,
    height: 10,
    priority: 1,
    visible: true,
    positioning: 'center-right',
  };

  it('display 1 label inside screen, hide 1 outside screen', () => {
    const labels1: Array<LabelRect> = [labelIn1, labelOutside];
    expect(collisionDetect(labels1, 100, 100)).toEqual(new Set(['in-1']));
  });

  it('display 1 label with higher priority', () => {
    const labels2: Array<LabelRect> = [labelIn1, labelOutside, labelIn2];
    expect(collisionDetect(labels2, 100, 100)).toEqual(new Set(['in-2']));
  });

  it('display two labels, hide 1 label with lower priority', () => {
    const labels3 = [labelIn1, labelOutside, labelIn2, labelIn3];
    expect(collisionDetect(labels3, 100, 100)).toEqual(
      new Set(['in-2', 'in-3']),
    );
  });

  it('display two labels with default visibility', () => {
    const labels4 = [labelIn1, labelOutside, labelIn2, labelIn3, labelIn4];
    expect(collisionDetect(labels4, 100, 100)).toEqual(
      new Set(['in-2', 'in-4']),
    );
  });

  it('display two labels with default visibility but reset', () => {
    const labels4 = [labelIn1, labelOutside, labelIn2, labelIn3, labelIn4];
    expect(collisionDetect(labels4, 100, 100, true)).toEqual(
      new Set(['in-2', 'in-3']),
    );
  });

  it('display 3 labels with 2 are default visible', () => {
    const labels5 = [
      labelIn1,
      labelOutside,
      labelIn2,
      labelIn4,
      labelIn3,
      labelIn5,
    ];
    expect(collisionDetect(labels5, 100, 100)).toEqual(
      new Set(['in-2', 'in-4', 'in-5']),
    );
  });

  it('display 1 label which is partially inside', () => {
    const labels6 = [labelIn6];
    expect(collisionDetect(labels6, 100, 100)).toEqual(
      new Set(['in-partialInside']),
    );
  });

  it('display 3 label', () => {
    const labels7 = [labelIn7, labelIn8, labelIn9];
    expect(collisionDetect(labels7, 1000, 1000)).toEqual(
      new Set(['bottom-center', 'top-center', 'center-right']),
    );
  });
});
