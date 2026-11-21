import { normalizeUsage } from '@server/modules/ai/service/aiTelemetry'

describe('normalizeUsage', () => {
  test.each([
    ['v4 nested', { inputTokens: { total: 12 }, outputTokens: { total: 7 } }, { tokensIn: 12, tokensOut: 7 }],
    ['flat (generateText result)', { inputTokens: 3, outputTokens: 4 }, { tokensIn: 3, tokensOut: 4 }],
    ['legacy', { promptTokens: 5, completionTokens: 6 }, { tokensIn: 5, tokensOut: 6 }],
    [
      'unknown',
      { inputTokens: { total: undefined }, outputTokens: { total: undefined } },
      { tokensIn: 0, tokensOut: 0 },
    ],
    ['missing', undefined, { tokensIn: 0, tokensOut: 0 }],
  ])('%s', (_label, usage, expected) => {
    expect(normalizeUsage(usage)).toEqual(expected)
  })
})
