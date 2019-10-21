import * as R from 'ramda';

export const toNumber = num => R.isNil(num) || R.isEmpty(num) ? NaN : Number(num)

export const isInteger = R.pipe(toNumber, Number.isInteger)

export const isFloat = R.pipe(toNumber, Number.isFinite)

export default {
  toNumber,
  isFloat,
  isInteger,
};
