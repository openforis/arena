import { diffWithDefaultLanguage, flattenTexts, getPath, LANGUAGES, RESOURCES } from '../utils/i18nParity'

// every AI text group (namespace first): each language has the keys and the placeholders of en
const GROUPS = [
  'common.aiAssistant',
  'common.aiBatch',
  'common.aiCleaning',
  'common.aiPolicy',
  'common.aiDataLocation',
  'homeView.surveyInfo.aiPolicy',
  'userAiSettings',
  'aiSuggestions',
]

describe('AI i18n parity with en (610)', () => {
  test.each(LANGUAGES.flatMap((lang) => GROUPS.map((group) => [lang, group])))('%s has %s as en', (lang, group) => {
    expect(diffWithDefaultLanguage(lang, group)).toEqual({ missing: [], extra: [], placeholders: [] })
  })

  // an empty or missing group would pass the key comparison above; an empty text would show nothing
  test.each(GROUPS)('%s in en has keys', (group) => {
    expect(Object.keys(flattenTexts(getPath(RESOURCES.en, group))).length).toBeGreaterThan(0)
  })

  test.each(LANGUAGES.flatMap((lang) => GROUPS.map((group) => [lang, group])))(
    '%s has only non-empty texts in %s',
    (lang, group) => {
      const empty = Object.entries(flattenTexts(getPath(RESOURCES[lang], group))).filter(([, text]) => !text.trim())
      expect(empty).toEqual([])
    }
  )
})
