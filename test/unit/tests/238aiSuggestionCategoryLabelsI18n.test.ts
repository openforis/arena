import {
  CYRILLIC,
  LANGUAGES,
  enTextOf,
  expectedTexts,
  getNamespaceText,
  getText,
  placeholders,
} from '@test/unit/utils/aiSuggestionsI18n'

// the card text (aiSuggestions) and the texts of Tasks 1, 3, 6, 7 and 8 (test 102 checks only the keys of common)
const CARD_KEYS = { plural: ['categoryItemTranslations.card'], single: [] as string[] }
const OTHER_KEYS: [string, string][] = [
  ['common', 'aiAssistant.tools.categoryItems_listMissingLabels'],
  ['common', 'aiAssistant.tools.categoryItemLabels_proposeSet'],
  ['common', 'aiAssistant.card.categoryItem'],
  ['common', 'aiAssistant.issues.categoryNotFound'],
  ['appErrors', 'categoryItemLabelsInvalid'],
]

// each text to check, with the English text whose placeholders it must keep
const textsOf = (lang: string): { path: string; text: unknown; enText: string }[] => [
  ...expectedTexts(lang, CARD_KEYS).map(({ path, enPath }) => ({
    path,
    text: getText(lang, path),
    enText: enTextOf(enPath),
  })),
  ...OTHER_KEYS.map(([namespace, path]) => ({
    path,
    text: getNamespaceText(lang, namespace, path),
    enText: getNamespaceText('en', namespace, path) as string,
  })),
]

describe('texts of the category labels suggestion (238)', () => {
  test.each(LANGUAGES)('%s has every text with the English placeholders', (lang) => {
    for (const { path, text, enText } of textsOf(lang)) {
      expect({ path, type: typeof text }).toEqual({ path, type: 'string' })
      expect({ path, placeholders: placeholders(text as string) }).toEqual({ path, placeholders: placeholders(enText) })
    }
  })

  test.each(['ru', 'mn'])('%s texts are written in Cyrillic', (lang) => {
    for (const { path, text } of textsOf(lang)) {
      expect({ path, text }).toEqual({ path, text: expect.stringMatching(CYRILLIC) })
    }
  })
})
