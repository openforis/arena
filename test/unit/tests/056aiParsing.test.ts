import { z } from 'zod'

import {
  extractTaggedValue,
  parseJsonResponse,
  safeParseJsonResponse,
  stripCodeFences,
  withOneRetry,
} from '@common/ai/parsing'

describe('stripCodeFences', () => {
  test.each([
    ['plain text', 'plain text'],
    ['```\ncode\n```', 'code'],
    ['```json\n{"a":1}\n```', '{"a":1}'],
    ['  ```js  x > 1  ```  ', 'x > 1'],
    ['no ``` closing', 'no ``` closing'],
  ])('%p → %p', (input, expected) => {
    expect(stripCodeFences(input)).toBe(expected)
  })

  test('tolerates null and undefined', () => {
    expect(stripCodeFences(null)).toBe('')
    expect(stripCodeFences(undefined)).toBe('')
  })
})

describe('extractTaggedValue', () => {
  test('returns the trimmed tag content, case-insensitive', () => {
    expect(extractTaggedValue('a <Expression> x > 1 </Expression> b', 'expression')).toBe('x > 1')
  })

  test('returns null when the tag is missing', () => {
    expect(extractTaggedValue('x > 1', 'expression')).toBeNull()
  })

  test('takes the first occurrence and supports multi-line content', () => {
    expect(extractTaggedValue('<e>one\ntwo</e><e>three</e>', 'e')).toBe('one\ntwo')
  })
})

describe('parseJsonResponse', () => {
  test('parses fenced JSON surrounded by prose', () => {
    expect(parseJsonResponse('Sure!\n```json\n{"a": [1, 2]}\n```')).toEqual({ a: [1, 2] })
    expect(parseJsonResponse('Here it is: {"a": 1} hope it helps')).toEqual({ a: 1 })
  })

  test('throws when there is no JSON object', () => {
    expect(() => parseJsonResponse('no json here')).toThrow('No JSON object found in model output')
  })

  test('throws on invalid JSON', () => {
    expect(() => parseJsonResponse('{"a": }')).toThrow()
  })
})

describe('safeParseJsonResponse', () => {
  const Schema = z.object({ a: z.number() })

  test('returns the validated value', () => {
    expect(safeParseJsonResponse('{"a": 1}', Schema)).toEqual({ value: { a: 1 }, error: null })
  })

  test('returns an error for invalid JSON or a schema mismatch, never throws', () => {
    expect(safeParseJsonResponse('nothing', Schema).error).toMatch(/No JSON object/)
    const mismatch = safeParseJsonResponse('{"a": "x"}', Schema)
    expect(mismatch.value).toBeNull()
    expect(mismatch.error).toMatch(/invalid JSON answer/)
  })
})

describe('withOneRetry', () => {
  test('does not retry when the first result is accepted', async () => {
    const run = jest.fn(async () => 'ok')
    expect(await withOneRetry({ run, getRetryFeedback: () => null })).toBe('ok')
    expect(run).toHaveBeenCalledTimes(1)
    expect(run).toHaveBeenCalledWith(null)
  })

  test('retries exactly once with the feedback, and returns the second result even if rejected', async () => {
    const run = jest.fn(async (feedback) => (feedback ? 'second' : 'first'))
    const onRetry = jest.fn()
    const result = await withOneRetry({ run, getRetryFeedback: () => ({ message: 'bad' }), onRetry })
    expect(result).toBe('second')
    expect(run).toHaveBeenCalledTimes(2)
    expect(run).toHaveBeenLastCalledWith({ message: 'bad' })
    expect(onRetry).toHaveBeenCalledWith({ message: 'bad' })
  })

  test('does not retry when run throws (transport errors are not the model’s fault)', async () => {
    const run = jest.fn(async () => {
      throw new Error('network')
    })
    await expect(withOneRetry({ run, getRetryFeedback: () => ({ message: 'x' }) })).rejects.toThrow('network')
    expect(run).toHaveBeenCalledTimes(1)
  })
})
