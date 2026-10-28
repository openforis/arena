import { CYRILLIC, CYRILLIC_LANGUAGES, expectedTexts, getText } from '@test/unit/utils/aiSuggestionsI18n'

// card keys of Part 2: plural ones get the language's i18next suffixes
const CARD_KEYS = {
  plural: [
    'missingTranslations.card',
    'newEntriesDescriptions.card',
    'entityWithoutKey.card',
    'attributeWithoutRef.card',
    'publishErrors.card',
  ],
  single: ['entityWithoutKey.cardSingle', 'attributeWithoutRef.cardCategory', 'attributeWithoutRef.cardTaxonomy'],
}

describe('card texts of the Design suggestions (228)', () => {
  test.each(CYRILLIC_LANGUAGES)('%s texts are written in Cyrillic', (lang) => {
    for (const { path } of expectedTexts(lang, CARD_KEYS)) {
      expect({ path, text: getText(lang, path) }).toEqual({ path, text: expect.stringMatching(CYRILLIC) })
    }
  })
})
