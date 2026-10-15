import { createI18nAsync } from '@core/i18n/i18nFactory'

import { type SuggestionDescribeContext } from '@webapp/ai/suggestions/definitions'
import { SUGGESTION_DEFINITIONS } from '@webapp/ai/suggestions/registry'
import {
  DATA_IMPORTED_CARD_KEY,
  DATA_IMPORTED_CARD_ONE_KEY,
  dataImportedDefinition,
} from '@webapp/ai/suggestions/definitions/dataImported'
import { buildDataImportedSuggestion } from '@webapp/ai/suggestions/detectors/dataImported'
import { DATA_IMPORTED_PROMPT } from '@webapp/ai/suggestions/prompts/dataImported'
import { CYRILLIC, LANGUAGES, RESOURCES, usesCyrillic } from '../utils/i18nParity'

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
 * Builds the suggestion of an import.
 * @param {number} count - Records imported.
 * @returns {object} The suggestion.
 */
const suggestionOf = (count: number) =>
  buildDataImportedSuggestion({ surveyId: 7, jobUuid: 'job-1', count, createdAt: new Date('2026-10-11T10:00:00Z') })

/**
 * Returns the {{placeholders}} of a text, sorted.
 * @param {string} text - The text.
 * @returns {string[]} The placeholders.
 */
const placeholders = (text: string): string[] => (text.match(/{{\s*[\w.]+\s*}}/g) ?? []).sort()

describe('data imported suggestion card and prompt (244)', () => {
  test('card: one record, or the formatted count', () => {
    expect(DATA_IMPORTED_CARD_KEY).toBe('dataImported.card')
    expect(DATA_IMPORTED_CARD_ONE_KEY).toBe('dataImported.cardOne')
    expect(dataImportedDefinition.card(suggestionOf(1), describeCtx('en'))).toEqual({
      key: 'dataImported.cardOne',
      params: {},
    })
    expect(dataImportedDefinition.card(suggestionOf(1200), describeCtx('en'))).toEqual({
      key: 'dataImported.card',
      params: { count: '1,200' },
    })
  })

  test('prompt: the spec text', () => {
    expect(DATA_IMPORTED_PROMPT).toBe(
      'Records were just imported into this survey. Give a quick overview of the collected data: records per step ' +
        'and over time (records_countByStep, records_countOverTime), and anything that looks unusual.'
    )
    expect(dataImportedDefinition.prompt(suggestionOf(5), describeCtx('en'))).toBe(DATA_IMPORTED_PROMPT)
  })

  test('registered among the definitions', () => {
    expect(SUGGESTION_DEFINITIONS.dataImported).toBe(dataImportedDefinition)
  })

  test('the card texts exist in every language', () => {
    for (const lang of LANGUAGES) {
      const { card, cardOne } = RESOURCES[lang].aiSuggestions?.dataImported ?? {}
      expect(typeof card).toBe('string')
      expect(typeof cardOne).toBe('string')
      expect(placeholders(card)).toEqual(['{{count}}'])
      expect(placeholders(cardOne)).toEqual([])
      expect(CYRILLIC.test(card)).toBe(usesCyrillic(lang))
      expect(CYRILLIC.test(cardOne)).toBe(usesCyrillic(lang))
    }
  })

  test('the cards render in English', async () => {
    const { t } = await createI18nAsync('en')
    expect((t as any)('aiSuggestions:dataImported.card', { count: '1,200' })).toBe(
      'Imported 1,200 records. Get a quick overview?'
    )
    expect((t as any)('aiSuggestions:dataImported.cardOne')).toBe('Imported 1 record. Get a quick overview?')
  })
})
