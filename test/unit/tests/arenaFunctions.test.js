import * as A from '@core/arena'

const obj = { a: 1, b: { c: [1, 2, { d: 3 }] }, e: null, h: NaN }
const isNum = (x) => typeof x === 'number'
const inc = (x) => x + 1

const tests = [
  // access
  ['prop', ['a', obj], 1],
  ['prop', ['a', null], undefined],
  ['prop', [-1, [1, 2]], 2],
  ['propOr', ['D', 'a', obj], 1],
  ['propOr', ['D', 'e', obj], 'D'],
  ['propOr', ['D', 'h', obj], 'D'],
  ['propOr', ['D', 'a', undefined], 'D'],
  ['path', [['b', 'c', 2, 'd'], obj], 3],
  ['path', [['b', 'c', -1, 'd'], obj], 3],
  ['path', [['z', 'y'], obj], undefined],
  ['pathOr', ['D', ['e'], obj], 'D'],
  ['pathOr', ['D', ['b', 'c', 0], obj], 1],
  ['nth', [-1, 'abc'], 'c'],
  ['head', [[1, 2]], 1],
  ['last', [[1, 2]], 2],
  ['tail', [[1, 2, 3]], [2, 3]],
  ['take', [2, [1, 2, 3]], [1, 2]],
  ['dropLast', [1, [1, 2, 3]], [1, 2]],
  ['slice', [1, 3, 'abcd'], 'bc'],
  ['length', [[1, 2]], 2],
  // equality (note: propEq/pathEq take the name/path first, the value second)
  ['propEq', ['a', 1, obj], true],
  ['propEq', ['a', 2, obj], false],
  ['propEq', ['a', 1, null], false],
  ['pathEq', [['b', 'c', 2, 'd'], 3, obj], true],
  ['equals', [obj, { ...obj, h: NaN }], true],
  [
    'equals',
    [
      [1, [2]],
      [1, [3]],
    ],
    false,
  ],
  ['equals', [0, -0], false],
  ['equals', [new Date(5), new Date(5)], true],
  ['includes', [{ x: 1 }, [{ x: 1 }, 2]], true],
  ['includes', ['b', 'abc'], true],
  ['isNil', [undefined], true],
  ['isNil', [0], false],
  ['is', [String, 'a'], true],
  ['is', [Object, null], false],
  ['not', [0], true],
  ['defaultTo', ['D', NaN], 'D'],
  ['defaultTo', ['D', 0], 0],
  // objects
  ['assoc', ['a', 2, { a: 1 }], { a: 2 }],
  ['assoc', [1, 'x', [1, 2, 3]], [1, 'x', 3]],
  ['assocPath', [['a', 'b'], 1, {}], { a: { b: 1 } }],
  ['assocPath', [['a', 0, 'b'], 1, {}], { a: [{ b: 1 }] }],
  ['dissocPath', [['b', 'c', 1], obj], { ...obj, b: { c: [1, { d: 3 }] } }],
  ['dissocPath', [['z', 'y'], { a: 1 }], { a: 1 }],
  ['dissoc', ['a', { a: 1, b: 2 }], { b: 2 }],
  ['omit', [['a'], { a: 1, b: 2 }], { b: 2 }],
  ['pick', [['a', 'z'], { a: 1, b: 2 }], { a: 1 }],
  ['has', ['a', { a: undefined }], true],
  ['has', ['toString', {}], false],
  ['keys', [null], []],
  ['values', [{ a: 1, b: 2 }], [1, 2]],
  ['toPairs', [{ a: 1 }], [['a', 1]]],
  ['fromPairs', [[['a', 1]]], { a: 1 }],
  ['mergeLeft', [{ a: 1 }, { a: 2, b: 3 }], { a: 1, b: 3 }],
  ['mergeAll', [[{ a: 1 }, { a: 2, b: 3 }]], { a: 2, b: 3 }],
  ['mergeDeepRight', [{ a: { b: 1, c: 2 } }, { a: { b: 5 } }], { a: { b: 5, c: 2 } }],
  ['mergeDeepLeft', [{ a: { b: 1 } }, { a: { b: 5, c: 2 } }], { a: { b: 1, c: 2 } }],
  ['mapObjIndexed', [(v, k) => `${k}${v}`, { a: 1 }], { a: 'a1' }],
  ['propSatisfies', [isNum, 'a', obj], true],
  ['pluck', ['id', [{ id: 1 }, { id: 2 }]], [1, 2]],
  // collections
  ['map', [inc, [1, 2]], [2, 3]],
  ['map', [inc, { a: 1 }], { a: 2 }],
  ['filter', [isNum, [1, 'a', 2]], [1, 2]],
  ['filter', [isNum, { a: 1, b: 'x' }], { a: 1 }],
  ['reject', [isNum, [1, 'a', 2]], ['a']],
  ['find', [isNum, ['a', 2]], 2],
  ['findIndex', [isNum, ['a', 2]], 1],
  ['findLastIndex', [isNum, [1, 'a', 2, 'b']], 2],
  ['any', [isNum, ['a', 2]], true],
  ['all', [isNum, []], true],
  ['none', [isNum, ['a']], true],
  ['reduce', [(acc, x) => acc + x, 0, [1, 2, 3]], 6],
  ['flatten', [[1, [2, [3]]]], [1, 2, 3]],
  ['append', [3, [1, 2]], [1, 2, 3]],
  ['concat', [[1], [2]], [1, 2]],
  ['uniq', [[1, 1, { a: 1 }, { a: 1 }]], [1, { a: 1 }]],
  ['difference', [[1, 2, 2, 3], [3]], [1, 2]],
  ['without', [[1], [1, 2, 1]], [2]],
  [
    'intersection',
    [
      [1, 2, 3, 3],
      [3, 1],
    ],
    [3, 1],
  ],
  ['innerJoin', [(a, b) => a === b, [1, 2, 3], [3, 2]], [2, 3]],
  ['sort', [(a, b) => a - b, [3, 1, 2]], [1, 2, 3]],
  ['sortBy', [(x) => x.id, [{ id: 2 }, { id: 1 }]], [{ id: 1 }, { id: 2 }]],
  ['update', [1, 'z', [1, 2, 3]], [1, 'z', 3]],
  ['remove', [1, 1, [1, 2, 3]], [1, 3]],
  ['times', [(i) => i * 2, 3], [0, 2, 4]],
  ['join', ['-', [1, 2]], '1-2'],
  ['split', ['-', 'a-b'], ['a', 'b']],
  ['replace', [/a/g, 'x', 'banana'], 'bxnxnx'],
  ['replace', [/a/, 'x', 'banana'], 'bxnana'],
  ['startsWith', ['ab', 'abc'], true],
  ['startsWith', [[2], [1, 2]], false],
  ['trim', [' a '], 'a'],
  ['toLower', ['AB'], 'ab'],
  ['toUpper', ['ab'], 'AB'],
  ['toString', ['abc'], '"abc"'],
  ['toString', [5], '5'],
  ['toString', [[1, 'a']], '[1, "a"]'],
  ['add', [1, 2], 3],
  ['max', [1, 2], 2],
  // functions
  ['when', [isNum, inc, 1], 2],
  ['when', [isNum, inc, 'a'], 'a'],
  ['unless', [isNum, String, 1], 1],
  ['unless', [isNum, String, {}], '[object Object]'],
]

describe('A functions (Ramda replacements)', () => {
  tests.forEach(([name, args, expected]) => {
    it(`${name}(${args.map((a) => (typeof a === 'function' ? 'fn' : JSON.stringify(a))).join(', ')})`, () => {
      expect(A[name](...args)).toEqual(expected)
    })
    it(`${name} is curried`, () => {
      expect(args.reduce((fn, arg) => fn(arg), A[name])).toEqual(expected)
    })
  })

  it('ifElse picks the branch and preserves the arguments', () => {
    expect(A.ifElse(isNum, inc, A.identity)(1)).toBe(2)
    expect(A.ifElse(isNum, inc, A.identity)('a')).toBe('a')
  })

  it('always / partialRight / pipe', () => {
    expect(A.always(5)()).toBe(5)
    expect(A.partialRight((a, b, c) => [a, b, c], [9])(1, 2)).toEqual([1, 2, 9])
    expect(A.pipe(A.prop('a'), inc)({ a: 1 })).toBe(2)
  })

  it('supports the placeholder', () => {
    expect(A.assoc('a', A.__, {})(1)).toEqual({ a: 1 })
  })

  it('does not mutate the inputs', () => {
    const input = { a: [1, 2] }
    A.assocPath(['a', 0], 9, input)
    A.dissocPath(['a', 0], input)
    A.sort((a, b) => b - a, input.a)
    expect(input).toEqual({ a: [1, 2] })
  })
})
