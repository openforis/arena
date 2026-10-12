import type { AssistantMessageUsage, ConversationMessage } from '@webapp/ai/conversations/types'
import {
  buildContextMeter,
  CONTEXT_CRITICAL_RATIO,
  CONTEXT_RING_CIRCUMFERENCE,
  CONTEXT_WARNING_RATIO,
  formatTokenCount,
  getContextMeterLevel,
  getContextMeterShortText,
  getContextMeterText,
  getContextRingDashArray,
  getLatestUsage,
} from '@webapp/components/ai/Assistant/contextMeterModel'
import { fakeT } from '@test/unit/utils/assistantTestUtils'

const usage = (overrides: Partial<AssistantMessageUsage> = {}): AssistantMessageUsage => ({
  contextTokens: 12400,
  windowTokens: 120000,
  windowAssumed: false,
  estimated: false,
  historyTrimmed: false,
  ...overrides,
})

let nextId = 0
const user = (): ConversationMessage => ({ id: `u${nextId++}`, role: 'user', text: 'Hi', createdAt: 'T' })
const answer = (withUsage?: AssistantMessageUsage, status: 'done' | 'streaming' = 'done'): ConversationMessage => ({
  id: `a${nextId++}`,
  role: 'assistant',
  parts: [],
  status,
  createdAt: 'T',
  ...(withUsage ? { usage: withUsage } : {}),
})

const meterOf = (value: AssistantMessageUsage) => buildContextMeter({ messages: [user(), answer(value)], lang: 'en' })

describe('context meter model (205)', () => {
  test('nothing before the first answer with a usage', () => {
    expect(buildContextMeter({ messages: [], lang: 'en' })).toBeNull()
    expect(buildContextMeter({ messages: [user()], lang: 'en' })).toBeNull()
    // an answer saved before the meter existed
    expect(buildContextMeter({ messages: [user(), answer()], lang: 'en' })).toBeNull()
  })

  test('the latest answer with a usage wins; a streaming answer keeps the previous one', () => {
    const first = usage({ contextTokens: 1000 })
    const second = usage({ contextTokens: 2000 })
    expect(getLatestUsage([user(), answer(first), user(), answer(second)])).toBe(second)
    expect(getLatestUsage([user(), answer(first), user(), answer(undefined, 'streaming')])).toBe(first)
  })

  test('thresholds: amber from 80 %, red from 95 %', () => {
    expect(CONTEXT_WARNING_RATIO).toBe(0.8)
    expect(CONTEXT_CRITICAL_RATIO).toBe(0.95)
    expect(getContextMeterLevel(null)).toBe('normal')
    expect(getContextMeterLevel(0.79)).toBe('normal')
    expect(getContextMeterLevel(0.8)).toBe('warning')
    expect(getContextMeterLevel(0.949)).toBe('warning')
    expect(getContextMeterLevel(0.95)).toBe('critical')
    expect(meterOf(usage({ contextTokens: 6554, windowTokens: 8192 }))?.level).toBe('warning')
    expect(meterOf(usage({ contextTokens: 7783, windowTokens: 8192 }))?.level).toBe('critical')
  })

  test('with a window: ratio, bar value and both numbers', () => {
    expect(meterOf(usage())).toEqual({
      contextTokens: 12400,
      windowTokens: 120000,
      ratio: 12400 / 120000,
      barValue: 12400,
      level: 'normal',
      estimated: false,
      windowAssumed: false,
      historyTrimmed: false,
      usedText: '12.4K',
      windowText: '120K',
    })
  })

  test('without a window: no bar, no level, never assumed', () => {
    expect(meterOf(usage({ windowTokens: null, windowAssumed: true, estimated: true }))).toMatchObject({
      windowTokens: null,
      ratio: null,
      barValue: null,
      level: 'normal',
      windowAssumed: false,
      estimated: true,
      windowText: null,
    })
  })

  test('usage above the window: full red bar within its maximum, real numbers in the text (review focus 3)', () => {
    expect(meterOf(usage({ contextTokens: 9000, windowTokens: 8192 }))).toMatchObject({
      ratio: 1,
      barValue: 8192,
      level: 'critical',
      usedText: '9K',
      windowText: '8.2K',
    })
  })

  test('compact numbers in the UI language; an invalid language tag falls back to English', () => {
    expect(formatTokenCount(950, 'en')).toBe('950')
    expect(formatTokenCount(12400, 'en')).toBe('12.4K')
    expect(formatTokenCount(120000, 'en')).toBe('120K')
    expect(formatTokenCount(12400, 'en_US')).toBe('12.4K')
  })

  test('text: the window key, the assumed note and the estimate prefix', () => {
    const withWindow = meterOf(usage())!
    expect(getContextMeterText({ meter: withWindow, t: fakeT })).toBe(
      'aiAssistant.context.tokensOfWindow {"used":"12.4K","window":"120K"}'
    )
    const assumed = meterOf(usage({ contextTokens: 6000, windowTokens: 8192, windowAssumed: true, estimated: true }))!
    expect(getContextMeterText({ meter: assumed, t: fakeT })).toBe(
      '≈ aiAssistant.context.tokensOfWindow {"used":"6K","window":"8.2K"} aiAssistant.context.assumed'
    )
    const cloud = meterOf(usage({ windowTokens: null }))!
    expect(getContextMeterText({ meter: cloud, t: fakeT })).toBe('aiAssistant.context.tokens {"used":"12.4K"}')
  })

  test('ring: the filled arc is the share of the window; no arc without a window', () => {
    const c = CONTEXT_RING_CIRCUMFERENCE
    expect(getContextRingDashArray(0)).toBe(`0 ${c}`)
    expect(getContextRingDashArray(0.25)).toBe(`${c * 0.25} ${c}`)
    expect(getContextRingDashArray(1)).toBe(`${c} ${c}`)
    expect(getContextRingDashArray(null)).toBeNull()
  })

  test('short text: used and window, without the word tokens', () => {
    expect(getContextMeterShortText(meterOf(usage()))).toBe('12.4K / 120K')
    expect(getContextMeterShortText(meterOf(usage({ windowTokens: null })))).toBe('12.4K')
    expect(getContextMeterShortText(meterOf(usage({ estimated: true })))).toBe('≈ 12.4K / 120K')
  })
})
