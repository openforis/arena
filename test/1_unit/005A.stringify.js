import { assert } from 'chai'

import * as A from '@core/arena'

const tests = [
  { value: null, valueText: 'null', expected: null },
  { value: undefined, valueText: 'undefined', expected: null },

  { value: {}, valueText: '{}', expected: '{}' },
  {
    value: { a: 1, b: 'b' },
    valueText: "{ a: 1, b: 'b'}",
    expected: '{"a":1,"b":"b"}',
  },
  {
    value: { a: 1, b: 'lorem', c: { n: 5 }, d: [1, 3, 5] },
    valueText: "{ a: 1, b: 'lorem', c: { n: 5 }, d: [1, 3, 5] }",
    expected: '{"a":1,"b":"lorem","c":{"n":5},"d":[1,3,5]}',
  },

  { value: [], valueText: '[]', expected: '[]' },

  { value: [1, 2, 3], valueText: '[1,2,3]', expected: '[1,2,3]' },
  {
    value: [1, 2, { a: 1, b: 'lorem' }],
    valueText: '[1,2,3, {a: 1, b: "lorem"]',
    expected: '[1,2,{"a":1,"b":"lorem"}]',
  },

  { value: new Set(), valueText: 'new Set()', expected: '{"__type":"Set","__values":"[]"}' },

  { value: new Set([1, 2, 3]), valueText: 'new Set([1,2,3])', expected: '{"__type":"Set","__values":"[1,2,3]"}' },

  { value: new Map(), valueText: 'new Map()', expected: '{"__type":"Map","__values":"[]"}' },

  {
    value: new Map([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]),
    valueText: "new Map([[1, 'one'],[2, 'two'], [3, 'three']])",
    expected: '{"__type":"Map","__values":"[[1,\\"one\\"],[2,\\"two\\"],[3,\\"three\\"]]"}',
  },
  {
    value: {
      a: new Map([
        [1, 'one'],
        [2, 'two'],
        [3, 'three'],
      ]),
    },
    valueText: "{a: new Map([[1, 'one'],[2, 'two'], [3, 'three']])}",
    expected: '{"a":{"__type":"Map","__values":"[[1,\\"one\\"],[2,\\"two\\"],[3,\\"three\\"]]"}}',
  },

  {
    value: {
      a: 1,
      b: 'b',
      c: new Map([
        [1, 'one'],
        ['2', 'two'],
        [3, 'three'],
      ]),
      d: new Set([1, 2, 3]),
    },
    valueText: "{a: 1, b: 'b', c: {new Map([[1, 'one'],['2', 'two'], [3, 'three']])}, d: new Set([1,2,3]}",
    expected:
      '{"a":1,"b":"b","c":{"__type":"Map","__values":"[[1,\\"one\\"],[\\"2\\",\\"two\\"],[3,\\"three\\"]]"},"d":{"__type":"Set","__values":"[1,2,3]"}}',
  },
  { value: 0, valueText: '0', expected: '0' },
  { value: 10, valueText: '10', expected: '10' },
  { value: -10, valueText: '-10', expected: '-10' },
  { value: 10.5, valueText: '10.5', expected: '10.5' },
  { value: 'lorem', valueText: 'lorem', expected: '"lorem"' },
  { value: 'lorem lorem', valueText: 'lorem lorem', expected: '"lorem lorem"' },
]

describe('A.stringify', () => {
  tests.forEach(({ value, valueText, expected }) => {
    it(`${valueText} ->  ${expected}`, () => {
      const result = A.stringify(value)
      assert.deepEqual(String(expected), String(result))
      if (!A.isEmpty(result)) {
        assert.deepEqual(value, A.parse(result))
      }
    })
  })
})
