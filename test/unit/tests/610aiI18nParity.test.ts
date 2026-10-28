import { diffWithDefaultLanguage, LANGUAGES } from '../utils/i18nParity'

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
})
