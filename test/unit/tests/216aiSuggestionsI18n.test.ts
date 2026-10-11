import { createI18nAsync } from '@core/i18n/i18nFactory'

import en from '@core/i18n/resources/en'
import es from '@core/i18n/resources/es'
import fr from '@core/i18n/resources/fr'
import ja from '@core/i18n/resources/ja'
import mn from '@core/i18n/resources/mn'
import pt from '@core/i18n/resources/pt'
import ru from '@core/i18n/resources/ru'

const resources: Record<string, any> = { en, es, fr, ja, mn, pt, ru }
const languages = Object.keys(resources)

// plural forms each language must have (i18next 26, Intl.PluralRules)
const PLURAL_FORMS: Record<string, string[]> = {
  en: ['one', 'other'],
  es: ['one', 'other'],
  fr: ['one', 'other'],
  ja: ['other'],
  mn: ['one', 'other'],
  pt: ['one', 'other'],
  ru: ['one', 'few', 'many', 'other'],
}
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/
const CYRILLIC = /[Ѐ-ӿ]/

// "a.b.c" → string leaves
const flatten = (obj: Record<string, unknown>, prefix = ''): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') result[path] = value
    else Object.assign(result, flatten(value as Record<string, unknown>, path))
  }
  return result
}

const baseKeys = (lang: string): string[] =>
  [...new Set(Object.keys(flatten(resources[lang].aiSuggestions)).map((key) => key.replace(PLURAL_SUFFIX, '')))].sort()

const placeholders = (text: string): string[] => [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((match) => match[1]).sort()

// en text of a base key (the _other form of a plural)
const enTextOf = (key: string): string => {
  const texts = flatten(en.aiSuggestions)
  return texts[key] ?? texts[`${key}_other`]
}

describe('aiSuggestions i18n (216)', () => {
  test.each(languages)('%s registers the namespace', (lang) => {
    expect(typeof resources[lang].aiSuggestions).toBe('object')
  })

  test.each(languages)('%s has the same keys as en (plural suffixes aside)', (lang) => {
    expect(baseKeys(lang)).toEqual(baseKeys('en'))
  })

  test.each(languages)('%s keeps the placeholders of en', (lang) => {
    for (const [key, text] of Object.entries(flatten(resources[lang].aiSuggestions))) {
      const base = key.replace(PLURAL_SUFFIX, '')
      expect([key, placeholders(text)]).toEqual([key, placeholders(enTextOf(base))])
    }
  })

  test.each(languages)('%s has the plural forms of its language', (lang) => {
    const texts = flatten(resources[lang].aiSuggestions)
    const pluralBases = new Set(
      Object.keys(flatten(en.aiSuggestions))
        .filter((key) => PLURAL_SUFFIX.test(key))
        .map((key) => key.replace(PLURAL_SUFFIX, ''))
    )
    for (const base of pluralBases) {
      for (const form of PLURAL_FORMS[lang]) {
        expect([lang, `${base}_${form}`, typeof texts[`${base}_${form}`]]).toEqual([lang, `${base}_${form}`, 'string'])
      }
    }
  })

  test.each(['ru', 'mn'])('%s texts are written in Cyrillic', (lang) => {
    for (const [key, text] of Object.entries(flatten(resources[lang].aiSuggestions))) {
      expect([key, CYRILLIC.test(text)]).toEqual([key, true])
    }
  })

  test.each(languages)('%s texts differ from en (translated)', (lang) => {
    if (lang === 'en') return
    const texts = flatten(resources[lang].aiSuggestions)
    expect(texts['moduleIntro.card.designer']).not.toBe(enTextOf('moduleIntro.card.designer'))
    expect(texts.doIt).not.toBe(enTextOf('doIt'))
  })

  test('the button label follows the plural rules', async () => {
    const tOf = async (lang: string) => (await createI18nAsync(lang)).t as unknown as (k: string, p?: object) => string
    const tEn = await tOf('en')
    expect(tEn('aiSuggestions:buttonLabel', { count: 1 })).toBe('AI assistant: 1 suggestion')
    expect(tEn('aiSuggestions:buttonLabel', { count: 3 })).toBe('AI assistant: 3 suggestions')
    const tRu = await tOf('ru')
    expect(tRu('aiSuggestions:buttonLabel', { count: 1 })).toBe('ИИ-помощник: 1 подсказка')
    expect(tRu('aiSuggestions:buttonLabel', { count: 3 })).toBe('ИИ-помощник: 3 подсказки')
    expect(tRu('aiSuggestions:buttonLabel', { count: 5 })).toBe('ИИ-помощник: 5 подсказок')
    expect((await tOf('ja'))('aiSuggestions:buttonLabel', { count: 2 })).toBe('AIアシスタント: 2件の提案')
    expect(tEn('aiSuggestions:moduleIntro.card.designer')).toBe('New to the form designer? Ask me how it works.')
  })
})
