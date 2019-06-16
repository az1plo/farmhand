const { freeze } = Object;

export const FERTILIZER_BONUS = 0.5;
export const FERTILIZER_ITEM_ID = 'fertilizer';

export const INITIAL_FIELD_WIDTH = 6;
export const INITIAL_FIELD_HEIGHT = 10;

export const PURCHASEABLE_FIELD_SIZES = freeze(
  new Map([
    [1, { columns: 8, rows: 12, price: 1000 }],
    [2, { columns: 10, rows: 16, price: 2000 }],
    [3, { columns: 12, rows: 18, price: 3000 }],
  ])
);

export const PURCHASEABLE_COW_PENS = freeze(
  new Map([
    [1, { cows: 10, price: 1500 }],
    [2, { cows: 20, price: 2500 }],
    [3, { cows: 30, price: 3500 }],
  ])
);

// Buff/nerf chances
export const CROW_CHANCE = 0.1;
export const RAIN_CHANCE = 0.1;

export const SCARECROW_ITEM_ID = 'scarecrow';
export const SPRINKLER_ITEM_ID = 'sprinkler';
export const SPRINKLER_RANGE = 1;
