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

const enKeys = flatten(en.aiAssistant)

describe('aiAssistant i18n', () => {
  test.each(Object.keys(commonByLang))('%s has the same keys as en', (lang) => {
    expect(Object.keys(flatten(commonByLang[lang].aiAssistant)).sort()).toEqual(Object.keys(enKeys).sort())
  })

  test.each(Object.keys(commonByLang))('%s keeps the placeholders of en', (lang) => {
    const translated = flatten(commonByLang[lang].aiAssistant)
    for (const [key, text] of Object.entries(enKeys)) {
      expect([key, placeholders(translated[key])]).toEqual([key, placeholders(text)])
    }
  })

  test.each(['ru', 'mn'])('%s is written in Cyrillic', (lang) => {
    for (const [key, text] of Object.entries(flatten(commonByLang[lang].aiAssistant))) {
      expect([key, CYRILLIC.test(text)]).toEqual([key, true])
    }
  })

  test.each(Object.keys(settingsByLang))('%s has the assistant category', (lang) => {
    const { categories } = settingsByLang[lang]
    for (const key of ['chat', 'chatHint', 'assistant', 'assistantHint']) {
      expect(typeof categories[key]).toBe('string')
      const mustBeCyrillic = lang === 'ru' || lang === 'mn'
      expect([key, !mustBeCyrillic || CYRILLIC.test(categories[key])]).toEqual([key, true])
    }
  })
})
