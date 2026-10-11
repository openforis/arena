import { createI18nAsync } from '@core/i18n/i18nFactory'

import { assistantMarkers } from '@common/ai/prompts/assistantMarkers'
import { getScriptedStep } from '@server/modules/ai/service/mockScripts'
import { SUGGESTION_DEFINITIONS, type SuggestionDescribeContext } from '@webapp/ai/suggestions/definitions'
import { formatSuggestionCount } from '@webapp/ai/suggestions/definitions/formatSuggestionCount'
import {
  VALIDATION_ERRORS_CARD_KEY,
  validationErrorsDefinition,
} from '@webapp/ai/suggestions/definitions/validationErrors'
import { buildValidationErrorsSuggestion } from '@webapp/ai/suggestions/detectors/validationErrors'
import { VALIDATION_ERRORS_PROMPT } from '@webapp/ai/suggestions/prompts/validationErrors'

import { CYRILLIC, LANGUAGES, getText, placeholders } from '../utils/aiSuggestionsI18n'

/**
 * Returns a describe context in a UI language.
 * @param {string} lang - UI language.
 * @returns {SuggestionDescribeContext} The context.
 */
const describeCtx = (lang: string): SuggestionDescribeContext => ({
  survey: null,
  t: ((key: string) => key) as any,
  lang,
})

/**
 * Builds the suggestion of a count.
 * @param {number} count - Number of report rows.
 * @returns {object} The suggestion.
 */
const suggestionOf = (count: number) =>
  buildValidationErrorsSuggestion({ surveyId: 7, cycle: '0', count, createdAt: new Date('2026-10-11T10:00:00Z') })

const cleaningSystem: any = { role: 'system', content: `${assistantMarkers.cleaning}\nYou are the cleaning assistant.` }
const user = (text: string): any => ({ role: 'user', content: [{ type: 'text', text }] })

describe('validation errors suggestion card and prompt (241)', () => {
  test('counts are formatted in the UI language', () => {
    expect(formatSuggestionCount(412, 'en')).toBe('412')
    expect(formatSuggestionCount(1200, 'en')).toBe('1,200')
    expect(formatSuggestionCount(1200, 'not a language tag!')).toBe('1200')
  })

  test('card: the key and the count of the visible target', () => {
    expect(VALIDATION_ERRORS_CARD_KEY).toBe('validationErrors.card')
    expect(validationErrorsDefinition.card(suggestionOf(412), describeCtx('en'))).toEqual({
      key: 'validationErrors.card',
      params: { count: '412' },
    })
    expect(validationErrorsDefinition.card(suggestionOf(1200), describeCtx('en')).params).toEqual({ count: '1,200' })
  })

  test('prompt: the spec text, without any record data', () => {
    expect(VALIDATION_ERRORS_PROMPT).toBe(
      'Summarise the validation errors and warnings of this survey in the current cycle. Use validation_summarize. ' +
        'Group them by field and by kind, say which fields have the most, and what to check first.'
    )
    expect(validationErrorsDefinition.prompt(suggestionOf(412), describeCtx('en'))).toBe(VALIDATION_ERRORS_PROMPT)
  })

  test('registered among the definitions', () => {
    expect(SUGGESTION_DEFINITIONS.validationErrors).toBe(validationErrorsDefinition)
  })

  test('the card text exists in the 7 languages, with the count', () => {
    for (const lang of LANGUAGES) {
      const text = getText(lang, 'validationErrors.card')
      expect(typeof text).toBe('string')
      expect(placeholders(text as string)).toEqual(['count'])
    }
    for (const lang of ['ru', 'mn']) {
      expect(getText(lang, 'validationErrors.card')).toMatch(CYRILLIC)
    }
  })

  test('the card renders in English', async () => {
    const { t } = await createI18nAsync('en')
    expect((t as any)('aiSuggestions:validationErrors.card', { count: '412' })).toBe(
      '412 validation messages in this cycle. Summarise the patterns?'
    )
  })

  test('mock script (e2e): validation_summarize, then a text from its output', () => {
    expect(getScriptedStep([cleaningSystem, user(VALIDATION_ERRORS_PROMPT)])).toEqual({
      toolCall: { toolName: 'validation_summarize', input: {} },
    })
    const toolCall: any = {
      role: 'assistant',
      content: [{ type: 'tool-call', toolCallId: 'a', toolName: 'validation_summarize', input: {} }],
    }
    const toolResult: any = {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: 'a',
          toolName: 'validation_summarize',
          output: { type: 'json', value: { total: 24, groups: [{ path: 'cluster / plot / tree / tree_dec_2' }] } },
        },
      ],
    }
    expect(getScriptedStep([cleaningSystem, user(VALIDATION_ERRORS_PROMPT), toolCall, toolResult])).toEqual({
      text: 'MOCK: 24 validation messages; the most frequent are in cluster / plot / tree / tree_dec_2.',
    })
  })
})
