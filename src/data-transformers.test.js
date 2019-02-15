import { testCrop, testItem } from './test-utils';
import { RAIN_MESSAGE } from './strings';
import { FERTILIZER_BONUS } from './constants';
import {
  sampleItem1,
  sampleItem2,
  sampleCropSeedsItem1,
  sampleFieldTool1,
} from './data/items';

import * as fn from './data-transformers';

jest.mock('localforage');
jest.mock('./data/maps');
jest.mock('./data/items');

jest.mock('./constants', () => ({
  FERTILIZER_BONUS: 0.5,
  FERTILIZER_ITEM_ID: 'fertilizer',
  INITIAL_FIELD_WIDTH: 4,
  INITIAL_FIELD_HEIGHT: 4,
  RAIN_CHANCE: 0,
}));

describe('computeStateForNextDay', () => {
  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.75);
  });

  it('computes state for next day', () => {
    const {
      dayCount,
      field: [firstRow],
      valueAdjustments,
    } = fn.computeStateForNextDay({
      dayCount: 1,
      field: [
        [
          testCrop({
            itemId: 'sample-crop-1',
            wasWateredToday: true,
          }),
        ],
      ],
    });

    expect(dayCount).toEqual(2);
    expect(valueAdjustments['sample-crop-1']).toEqual(1.25);
    expect(valueAdjustments['sample-crop-2']).toEqual(1.25);
    expect(firstRow[0].wasWateredToday).toBe(false);
    expect(firstRow[0].daysWatered).toBe(1);
    expect(firstRow[0].daysOld).toBe(1);
  });
});

describe('applyRain', () => {
  it('waters all plots', () => {
    const state = fn.applyRain({
      field: [
        [
          testCrop({
            wasWateredToday: false,
          }),
          testCrop({
            wasWateredToday: false,
          }),
        ],
      ],
      newDayNotifications: [],
    });

    expect(state.field[0][0].wasWateredToday).toBe(true);
    expect(state.field[0][1].wasWateredToday).toBe(true);
    expect(state.newDayNotifications[0].message).toBe(RAIN_MESSAGE);
  });
});

describe('applyBuffs', () => {
  describe('rain', () => {
    describe('is not rainy day', () => {
      it('does not water plants', () => {
        const state = fn.applyBuffs({
          field: [[testCrop()]],
          newDayNotifications: [],
        });

        expect(state.field[0][0].wasWateredToday).toBe(false);
      });
    });

    describe('is rainy day', () => {
      it('does water plants', () => {
        jest.resetModules();
        jest.mock('./constants', () => ({
          RAIN_CHANCE: 1,
        }));

        const { applyBuffs } = jest.requireActual('./data-transformers');
        const state = applyBuffs({
          field: [[testCrop()]],
          newDayNotifications: [],
        });

        expect(state.field[0][0].wasWateredToday).toBe(true);
      });
    });
  });
});

describe('computePlayerInventory', () => {
  let playerInventory;
  let inventory;
  let valueAdjustments;

  beforeEach(() => {
    inventory = [{ quantity: 1, id: 'sample-item-1' }];
    valueAdjustments = {};
    playerInventory = fn.computePlayerInventory(inventory, valueAdjustments);
  });

  it('maps inventory state to renderable inventory data', () => {
    expect(playerInventory).toEqual([{ quantity: 1, ...sampleItem1 }]);
  });

  it('returns cached result with unchanged input', () => {
    const newPlayerInventory = fn.computePlayerInventory(
      inventory,
      valueAdjustments
    );
    expect(playerInventory).toEqual(newPlayerInventory);
  });

  it('invalidates cache with changed input', () => {
    playerInventory = fn.computePlayerInventory(
      [{ quantity: 1, id: 'sample-item-2' }],
      valueAdjustments
    );
    expect(playerInventory).toEqual([{ ...sampleItem2, quantity: 1 }]);
  });

  describe('with valueAdjustments', () => {
    beforeEach(() => {
      valueAdjustments = {
        'sample-item-1': 2,
      };

      playerInventory = fn.computePlayerInventory(inventory, valueAdjustments);
    });

    it('maps inventory state to renderable inventory data', () => {
      expect(playerInventory).toEqual([
        { ...sampleItem1, quantity: 1, value: 2 },
      ]);
    });
  });
});

describe('getUpdatedValueAdjustments', () => {
  let valueAdjustments;

  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(1);
    valueAdjustments = fn.getUpdatedValueAdjustments();
  });

  it('updates valueAdjustments by random factor', () => {
    expect(valueAdjustments['sample-crop-1']).toEqual(1.5);
    expect(valueAdjustments['sample-crop-2']).toEqual(1.5);
  });
});

describe('resetWasWatered', () => {
  it('updates wasWateredToday property', () => {
    expect(fn.resetWasWatered(testCrop({ itemId: 'sample-crop-1' }))).toEqual(
      testCrop({ itemId: 'sample-crop-1' })
    );

    expect(
      fn.resetWasWatered(
        testCrop({ itemId: 'sample-crop-2', wasWateredToday: true })
      )
    ).toEqual(testCrop({ itemId: 'sample-crop-2' }));

    expect(fn.resetWasWatered(null)).toBe(null);
  });
});

describe('addItemToInventory', () => {
  it('creates a new item in the inventory', () => {
    expect(
      fn.addItemToInventory(testItem({ id: 'sample-item-1' }), [])
    ).toEqual([{ id: 'sample-item-1', quantity: 1 }]);
  });

  it('increments an existing item in the inventory', () => {
    expect(
      fn.addItemToInventory(testItem({ id: 'sample-item-1' }), [
        testItem({ id: 'sample-item-1', quantity: 1 }),
      ])
    ).toEqual([
      testItem({
        id: 'sample-item-1',
        quantity: 2,
      }),
    ]);
  });
});

describe('getFieldToolInventory', () => {
  let fieldToolInventory;
  let inventory;

  beforeEach(() => {
    inventory = [{ id: 'sample-field-tool-1' }, { id: 'sample-item-1' }];
    fieldToolInventory = fn.getFieldToolInventory(inventory);
  });

  it('filters out non-field tool items', () => {
    expect(fieldToolInventory).toEqual([sampleFieldTool1]);
  });
});

describe('getFinalCropItemIdFromSeedItemId', () => {
  it('gets "final" crop item id from seed item id', () => {
    expect(fn.getFinalCropItemIdFromSeedItemId('sample-crop-seeds-1')).toEqual(
      'sample-crop-1'
    );
  });
});

describe('getPlantableInventory', () => {
  let plantableInventory;
  let inventory;

  beforeEach(() => {
    inventory = [{ id: 'sample-crop-seeds-1' }, { id: 'sample-item-1' }];
    plantableInventory = fn.getPlantableInventory(inventory);
  });

  it('filters out non-plantable items', () => {
    expect(plantableInventory).toEqual([sampleCropSeedsItem1]);
  });
});

describe('incrementAge', () => {
  describe('plant is not watered', () => {
    it('updates daysOld', () => {
      const { daysOld, daysWatered } = fn.incrementAge(
        testCrop({ itemId: 'sample-crop-1' })
      );

      expect(daysOld).toBe(1);
      expect(daysWatered).toBe(0);
    });
  });

  describe('plant is watered', () => {
    it('updates daysOld and daysWatered', () => {
      const { daysOld, daysWatered } = fn.incrementAge(
        testCrop({ itemId: 'sample-crop-1', wasWateredToday: true })
      );

      expect(daysOld).toBe(1);
      expect(daysWatered).toBe(1);
    });
  });

  describe('plant is fertilized', () => {
    it('updates daysOld with bonus', () => {
      const { daysWatered } = fn.incrementAge(
        testCrop({
          itemId: 'sample-crop-1',
          isFertilized: true,
          wasWateredToday: true,
        })
      );

      expect(daysWatered).toBe(1 + FERTILIZER_BONUS);
    });
  });
});

describe('decrementItemFromInventory', () => {
  let updatedInventory;

  describe('single instance of item in inventory', () => {
    beforeEach(() => {
      updatedInventory = fn.decrementItemFromInventory('sample-item-1', [
        testItem({ id: 'sample-item-1', quantity: 1 }),
      ]);
    });

    it('removes item from inventory', () => {
      expect(updatedInventory).toEqual([]);
    });
  });

  describe('multiple instances of item in inventory', () => {
    beforeEach(() => {
      updatedInventory = fn.decrementItemFromInventory('sample-item-1', [
        testItem({ id: 'sample-item-1', quantity: 2 }),
      ]);
    });

    it('decrements item', () => {
      expect(updatedInventory).toEqual([
        testItem({
          id: 'sample-item-1',
          quantity: 1,
        }),
      ]);
    });
  });
});
