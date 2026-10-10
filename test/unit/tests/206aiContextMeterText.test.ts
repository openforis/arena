import en from '@core/i18n/resources/en/common'

import type { AssistantMessageUsage } from '@webapp/ai/conversations/types'
import { buildContextMeter, getContextMeterText } from '@webapp/components/ai/Assistant/contextMeterModel'

/**
 * Translates with the en resources (no i18next in the unit tests).
 * @param {string} key - Key.
 * @param {object} [params] - Params.
 * @returns {string} The text.
 */
const enT = (key: string, params: Record<string, unknown> = {}): string => {
  const template = key.split('.').reduce<any>((node, part) => node?.[part], en)
  if (typeof template !== 'string') throw new Error(`missing en key ${key}`)
  return template.replaceAll(/\{\{(\w+)\}\}/g, (_match: string, name: string) => String(params[name]))
}

const textOf = (usage: AssistantMessageUsage): string => {
  const meter = buildContextMeter({
    messages: [{ id: 'a', role: 'assistant', parts: [], status: 'done', createdAt: 'T', usage }],
    lang: 'en',
  })
  return getContextMeterText({ meter: meter!, t: enT })
}

const base: AssistantMessageUsage = {
  contextTokens: 12400,
  windowTokens: 120000,
  windowAssumed: false,
  estimated: false,
  historyTrimmed: false,
}

describe('context meter text (206)', () => {
  test('the texts of the spec, in English', () => {
    expect(textOf(base)).toBe('12.4K / 120K tokens')
    expect(textOf({ ...base, windowTokens: null })).toBe('12.4K tokens')
    expect(textOf({ ...base, windowTokens: null, contextTokens: 1520, estimated: true })).toBe('≈ 1.5K tokens')
    expect(textOf({ ...base, contextTokens: 6000, windowTokens: 8192, windowAssumed: true })).toBe(
      '6K / 8.2K tokens (assumed)'
    )
  })

  test('the notes and the history copy', () => {
    expect(enT('aiAssistant.context.nearLimit')).toBe('Near the limit.')
    expect(enT('aiAssistant.context.trimmed')).toBe('Older messages are no longer sent to the model.')
    expect(enT('aiAssistant.menu.newConversation')).toBe('New conversation')
    expect(enT('aiAssistant.historyKept', { count: 30 })).toBe(
      'The latest 30 conversations of each survey are kept in this browser until you clear them.'
    )
    expect(typeof enT('aiAssistant.context.label')).toBe('string')
  })
})
