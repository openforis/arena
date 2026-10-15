import { AiFeatureCategory } from '@common/ai/features'

import {
  baseKeysOf,
  CYRILLIC,
  CYRILLIC_LANGUAGES,
  flattenTexts as flatten,
  generalForm,
  getPluralMismatches,
  LANGUAGES,
  namespaceByLanguage,
  placeholdersOf as placeholders,
} from '../utils/i18nParity'

const commonByLang = namespaceByLanguage('common')
const settingsByLang = namespaceByLanguage('userAiSettings')
const en = commonByLang.en
const enSettings = settingsByLang.en

const enKeys = flatten(en.aiAssistant)

describe('aiAssistant i18n', () => {
  test.each(LANGUAGES)('%s has the same keys as en', (lang) => {
    expect(baseKeysOf(flatten(commonByLang[lang].aiAssistant))).toEqual(baseKeysOf(enKeys))
  })

  test.each(LANGUAGES)('%s keeps the placeholders of en', (lang) => {
    const translated = flatten(commonByLang[lang].aiAssistant)
    for (const key of baseKeysOf(enKeys)) {
      expect([key, placeholders(generalForm(translated, key))]).toEqual([key, placeholders(generalForm(enKeys, key))])
    }
  })

  test.each(LANGUAGES)('%s has every plural form of its language in aiAssistant', (lang) => {
    expect(getPluralMismatches(lang, flatten(commonByLang[lang].aiAssistant))).toEqual([])
  })

  test.each(CYRILLIC_LANGUAGES)('%s is written in Cyrillic', (lang) => {
    for (const [key, text] of Object.entries(flatten(commonByLang[lang].aiAssistant))) {
      expect([key, CYRILLIC.test(text)]).toEqual([key, true])
    }
  })

  const enSettingsKeys = flatten(enSettings)
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

  test.each(LANGUAGES)('%s userAiSettings has the same keys as en', (lang) => {
    expect(baseKeysOf(flatten(settingsByLang[lang]))).toEqual(baseKeysOf(enSettingsKeys))
  })

  test.each(LANGUAGES)('%s userAiSettings keeps the placeholders of en', (lang) => {
    const translated = flatten(settingsByLang[lang])
    for (const key of baseKeysOf(enSettingsKeys)) {
      expect([key, placeholders(generalForm(translated, key))]).toEqual([
        key,
        placeholders(generalForm(enSettingsKeys, key)),
      ])
    }
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
