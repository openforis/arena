import { parseJsonResponse, stripCodeFences as stripFence } from '@common/ai/parsing'

describe('stripFence', () => {
  test.each([
    ['plain text', 'plain text'],
    ['  padded  ', 'padded'],
    ['```\nvalue\n```', 'value'],
    ['```js\nx > 0\n```', 'x > 0'],
    ['```json {"a":1} ```', '{"a":1}'],
    ['```', '```'],
    ['````', '````'],
    ['```abc```', ''],
    ['```value', '```value'],
  ])('%j -> %j', (input, expected) => {
    expect(stripFence(input)).toBe(expected)
  })

  test('is fast on long unbalanced input', () => {
    const input = '```' + ' '.repeat(100000) + 'x'
    const start = Date.now()
    expect(stripFence(input)).toBe(input.trim())
    expect(Date.now() - start).toBeLessThan(100)
  })
})

describe('parseJsonResponse', () => {
  test('parses fenced JSON surrounded by prose', () => {
    expect(parseJsonResponse('```json\nHere it is: {"a": 1} hope it helps\n```')).toEqual({ a: 1 })
  })

  test('throws when no JSON object is present', () => {
    expect(() => parseJsonResponse('no json')).toThrow(/No JSON object found/)
  })
})
