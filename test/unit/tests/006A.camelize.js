import * as A from '@core/arena'

const now = new Date()

const tests = [
  // null/undefined values
  { object: null, expected: null },
  { object: undefined, expected: undefined },
  // numeric values
  { object: 1, expected: 1 },
  // data values
  { object: now, expected: now },
  // test empty values
  { object: {}, expected: {} },
  // simple objects
  { object: { a: 1 }, expected: { a: 1 } },
  { object: { firstProp: 1 }, expected: { firstProp: 1 } },
  { object: { first_prop: 1 }, expected: { firstProp: 1 } },
  { object: { first_prop: 1, second_prop: 2 }, expected: { firstProp: 1, secondProp: 2 } },
  { object: { firstProp: 1, second_prop: 2 }, expected: { firstProp: 1, secondProp: 2 } },
  // complex objects
  {
    object: { first_prop: 1, second_prop: 2, third_prop: { third_prop_a: 11, third_prop_b: 12 } },
    expected: { firstProp: 1, secondProp: 2, thirdProp: { thirdPropA: 11, thirdPropB: 12 } },
  },
  // complex objects (skip keys)
  {
    object: { first_prop: 1, second_prop: 2, third_prop: { third_prop_a: 11, third_prop_b: 12 } },
    skip: ['third_prop'],
    expected: { firstProp: 1, secondProp: 2, third_prop: { third_prop_a: 11, third_prop_b: 12 } },
  },
]

describe('A.camelize', () => {
  tests.forEach(({ object, expected, skip = [] }) => {
    it(`${JSON.stringify(object)} ->  ${JSON.stringify(expected)}`, () => {
      const valueCamelized = A.camelize({ skip })(object)
      expect(valueCamelized).toEqual(expected)
    })
  })
})
