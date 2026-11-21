import { isNearBottom } from '@webapp/components/ai/Assistant/chatScrollModel'

describe('assistant chat scroll (405)', () => {
  test('a list scrolled to its end is at the bottom', () => {
    expect(isNearBottom({ scrollTop: 600, clientHeight: 400, scrollHeight: 1000 })).toBe(true)
  })

  test('a few pixels short of the end still counts as the bottom (fractional scroll positions)', () => {
    expect(isNearBottom({ scrollTop: 590, clientHeight: 400, scrollHeight: 1000 })).toBe(true)
  })

  test('a user who scrolled up to read is not at the bottom, so streaming leaves the position alone', () => {
    expect(isNearBottom({ scrollTop: 200, clientHeight: 400, scrollHeight: 1000 })).toBe(false)
  })

  test('a list shorter than its box is at the bottom', () => {
    expect(isNearBottom({ scrollTop: 0, clientHeight: 400, scrollHeight: 300 })).toBe(true)
  })

  test('the distance that counts as the bottom can be changed', () => {
    expect(isNearBottom({ scrollTop: 500, clientHeight: 400, scrollHeight: 1000 }, 100)).toBe(true)
    expect(isNearBottom({ scrollTop: 500, clientHeight: 400, scrollHeight: 1000 }, 50)).toBe(false)
  })
})
