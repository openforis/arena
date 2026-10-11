import { createI18nAsync } from '@core/i18n/i18nFactory'

import {
  CYRILLIC,
  LANGUAGES,
  PLURAL_FORMS,
  PLURAL_SUFFIX,
  baseKeys,
  enTextOf,
  flatten,
  getResource,
  placeholders,
} from '@test/unit/utils/aiSuggestionsI18n'

describe('aiSuggestions i18n (216)', () => {
  test.each(LANGUAGES)('%s registers the namespace', (lang) => {
    expect(typeof getResource(lang)).toBe('object')
  })

  test.each(LANGUAGES)('%s has the same keys as en (plural suffixes aside)', (lang) => {
    expect(baseKeys(lang)).toEqual(baseKeys('en'))
  })

  test.each(LANGUAGES)('%s keeps the placeholders of en', (lang) => {
    for (const [key, text] of Object.entries(flatten(getResource(lang)))) {
      const base = key.replace(PLURAL_SUFFIX, '')
      expect([key, placeholders(text)]).toEqual([key, placeholders(enTextOf(base))])
    }
  })

  test.each(LANGUAGES)('%s has the plural forms of its language', (lang) => {
    const texts = flatten(getResource(lang))
    const pluralBases = new Set(
      Object.keys(flatten(getResource('en')))
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
    for (const [key, text] of Object.entries(flatten(getResource(lang)))) {
      expect([key, CYRILLIC.test(text)]).toEqual([key, true])
    }
  })

  test.each(LANGUAGES)('%s texts differ from en (translated)', (lang) => {
    if (lang === 'en') return
    const texts = flatten(getResource(lang))
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
