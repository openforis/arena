import { AiFeatureCategory } from '@common/ai/features'

import {
  CYRILLIC,
  CYRILLIC_LANGUAGES,
  flattenTexts as flatten,
  getPluralMismatches,
  LANGUAGES,
  namespaceByLanguage,
} from '../utils/i18nParity'

const commonByLang = namespaceByLanguage('common')
const settingsByLang = namespaceByLanguage('userAiSettings')

describe('aiAssistant i18n', () => {
  test.each(LANGUAGES)('%s has every plural form of its language in aiAssistant', (lang) => {
    expect(getPluralMismatches(lang, flatten(commonByLang[lang].aiAssistant))).toEqual([])
  })

  test.each(CYRILLIC_LANGUAGES)('%s is written in Cyrillic', (lang) => {
    for (const [key, text] of Object.entries(flatten(commonByLang[lang].aiAssistant))) {
      expect([key, CYRILLIC.test(text)]).toEqual([key, true])
    }
  })

  // the panel blocks rewritten for the redesign: no English left in ru and mn
  const PANEL_PREFIXES = [
    'status.',
    'where.',
    'localServer.',
    'list.',
    'dialog.',
    'dataClasses.',
    'access.',
    'features.',
  ]

  test.each(LANGUAGES)('%s has every plural form of its language in userAiSettings', (lang) => {
    expect(getPluralMismatches(lang, flatten(settingsByLang[lang]))).toEqual([])
  })

  test.each(CYRILLIC_LANGUAGES)('%s panel texts are written in Cyrillic', (lang) => {
    for (const [key, text] of Object.entries(flatten(settingsByLang[lang]))) {
      if (!PANEL_PREFIXES.some((prefix) => key.startsWith(prefix))) continue
      expect([key, CYRILLIC.test(text)]).toEqual([key, true])
    }
  })

  test.each(LANGUAGES)('%s has a switch label and a "Sends:" text per category', (lang) => {
    const { categories, features } = settingsByLang[lang]
    expect(categories).toBeUndefined()
    for (const category of Object.values(AiFeatureCategory)) {
      expect([category, typeof features[category]?.label, typeof features[category]?.sends]).toEqual([
        category,
        'string',
        'string',
      ])
    }
  })
})
