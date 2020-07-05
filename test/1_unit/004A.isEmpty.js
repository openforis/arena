import { assert } from 'chai'

import * as A from '@core/arena'

const tests = [
  { value: null, expected: true },
  { value: undefined, expected: true },
  { value: {}, expected: true },
  { value: { a: 432 }, expected: false },
  { value: [], expected: true },
  { value: [1, 2], expected: false },
  { value: '', expected: true },
  { value: 'fsdafds', expected: false },
  { value: 0, expected: false },
  { value: 0.432, expected: false },
  { value: 234, expected: false },
  { value: new Set(), expected: true },
  { value: new Set([0, 1, 2]), expected: false },
  { value: new Map(), expected: true },
  {
    value: new Map([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]),
    expected: false,
  },
]

describe('A.isEmpty', () => {
  tests.forEach(({ value, expected }) => {
    it(`${JSON.stringify(value)} `, () => {
      assert.deepEqual(expected, A.isEmpty(value))
    })
  })
})
