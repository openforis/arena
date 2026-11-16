import { parseItemsLimit } from '@server/modules/category/api/categoryItemsLimit'

describe('category items limit', () => {
  test('a positive integer is kept and clamped to 1000', () => {
    expect(parseItemsLimit(10)).toBe(10)
    expect(parseItemsLimit(5000)).toBe(1000)
  })

  test('missing, negative, zero or fractional values mean no limit', () => {
    expect([null, -1, 0, 1.5, Number.NaN].map(parseItemsLimit)).toEqual([null, null, null, null, null])
  })
})
