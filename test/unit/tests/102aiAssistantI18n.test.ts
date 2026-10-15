import { AiFeatureCategory } from '@common/ai/features'

import en from '@core/i18n/resources/en/common'
import es from '@core/i18n/resources/es/common'
import fr from '@core/i18n/resources/fr/common'
import ja from '@core/i18n/resources/ja/common'
import mn from '@core/i18n/resources/mn/common'
import pt from '@core/i18n/resources/pt/common'
import ru from '@core/i18n/resources/ru/common'
import enSettings from '@core/i18n/resources/en/userAiSettings'
import esSettings from '@core/i18n/resources/es/userAiSettings'
import frSettings from '@core/i18n/resources/fr/userAiSettings'
import jaSettings from '@core/i18n/resources/ja/userAiSettings'
import mnSettings from '@core/i18n/resources/mn/userAiSettings'
import ptSettings from '@core/i18n/resources/pt/userAiSettings'
import ruSettings from '@core/i18n/resources/ru/userAiSettings'

const commonByLang: Record<string, any> = { en, es, fr, ja, mn, pt, ru }
const settingsByLang: Record<string, any> = {
  en: enSettings,
  es: esSettings,
  fr: frSettings,
  ja: jaSettings,
  mn: mnSettings,
  pt: ptSettings,
  ru: ruSettings,
}
const CYRILLIC = /[Ѐ-ӿ]/

const flatten = (obj: Record<string, any>, prefix = ''): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') result[path] = value
    else Object.assign(result, flatten(value, path))
  }
  return result
}

const placeholders = (text: string): string[] => (text.match(/\{\{\w+\}\}/g) ?? []).sort()

// a plural text has one key per form (seeAll_one, seeAll_few, ...) and each language has its own forms
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/
const baseKeysOf = (flat: Record<string, string>): string[] =>
  [...new Set(Object.keys(flat).map((key) => key.replace(PLURAL_SUFFIX, '')))].sort()
// the general form of a text: the "other" form of a plural, else the text itself
const generalForm = (flat: Record<string, string>, baseKey: string): string =>
  flat[`${baseKey}_other`] ?? flat[baseKey] ?? ''

const enKeys = flatten(en.aiAssistant)

describe('aiAssistant i18n', () => {
  test.each(Object.keys(commonByLang))('%s has the same keys as en', (lang) => {
    expect(baseKeysOf(flatten(commonByLang[lang].aiAssistant))).toEqual(baseKeysOf(enKeys))
  })

  test.each(Object.keys(commonByLang))('%s keeps the placeholders of en', (lang) => {
    const translated = flatten(commonByLang[lang].aiAssistant)
    for (const key of baseKeysOf(enKeys)) {
      expect([key, placeholders(generalForm(translated, key))]).toEqual([key, placeholders(generalForm(enKeys, key))])
    }
  })

  test.each(['ru', 'mn'])('%s is written in Cyrillic', (lang) => {
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

  test.each(Object.keys(settingsByLang))('%s userAiSettings has the same keys as en', (lang) => {
    expect(baseKeysOf(flatten(settingsByLang[lang]))).toEqual(baseKeysOf(enSettingsKeys))
  })

  test.each(Object.keys(settingsByLang))('%s userAiSettings keeps the placeholders of en', (lang) => {
    const translated = flatten(settingsByLang[lang])
    for (const key of baseKeysOf(enSettingsKeys)) {
      expect([key, placeholders(generalForm(translated, key))]).toEqual([
        key,
        placeholders(generalForm(enSettingsKeys, key)),
      ])
    }
  })

  test.each(['ru', 'mn'])('%s panel texts are written in Cyrillic', (lang) => {
    for (const [key, text] of Object.entries(flatten(settingsByLang[lang]))) {
      if (!PANEL_PREFIXES.some((prefix) => key.startsWith(prefix))) continue
      expect([key, CYRILLIC.test(text)]).toEqual([key, true])
    }
  })

  test.each(Object.keys(settingsByLang))('%s has a switch label and a "Sends:" text per category', (lang) => {
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
