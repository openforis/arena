import en from '@core/i18n/resources/en'
import es from '@core/i18n/resources/es'
import fr from '@core/i18n/resources/fr'
import ja from '@core/i18n/resources/ja'
import mn from '@core/i18n/resources/mn'
import pt from '@core/i18n/resources/pt'
import ru from '@core/i18n/resources/ru'
import { createI18nAsync } from '@core/i18n/i18nFactory'

import { SUGGESTION_DEFINITIONS, type SuggestionDescribeContext } from '@webapp/ai/suggestions/definitions'
import {
  DATA_IMPORTED_CARD_KEY,
  DATA_IMPORTED_CARD_ONE_KEY,
  dataImportedDefinition,
} from '@webapp/ai/suggestions/definitions/dataImported'
import { buildDataImportedSuggestion } from '@webapp/ai/suggestions/detectors/dataImported'
import { DATA_IMPORTED_PROMPT } from '@webapp/ai/suggestions/prompts/dataImported'

const languages: [string, any][] = [
  ['en', en],
  ['es', es],
  ['fr', fr],
  ['ja', ja],
  ['mn', mn],
  ['pt', pt],
  ['ru', ru],
]

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

  test('the card texts exist in the 7 languages', () => {
    for (const [lang, resources] of languages) {
      const { card, cardOne } = resources.aiSuggestions?.dataImported ?? {}
      expect(typeof card).toBe('string')
      expect(typeof cardOne).toBe('string')
      expect(placeholders(card)).toEqual(['{{count}}'])
      expect(placeholders(cardOne)).toEqual([])
      const cyrillic = lang === 'ru' || lang === 'mn'
      expect(/[Ѐ-ӿ]/.test(card)).toBe(cyrillic)
      expect(/[Ѐ-ӿ]/.test(cardOne)).toBe(cyrillic)
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
