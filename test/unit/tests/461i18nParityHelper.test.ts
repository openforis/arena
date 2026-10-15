import fs from 'node:fs'
import path from 'node:path'

import {
  CYRILLIC_LANGUAGES,
  diffWithDefaultLanguage,
  LANGUAGES,
  OTHER_LANGUAGES,
  pluralFormsOf,
  RESOURCES,
  usesCyrillic,
} from '../utils/i18nParity'

const resourcesDir = path.join(__dirname, '../../../core/i18n/resources')

describe('i18n parity helper (461)', () => {
  test('the languages are the folders of core/i18n/resources (a new folder must be registered in the factory)', () => {
    const folders = fs
      .readdirSync(resourcesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
    expect([...LANGUAGES].sort()).toEqual(folders.sort())
    expect(OTHER_LANGUAGES).not.toContain('en')
    expect(OTHER_LANGUAGES).toHaveLength(LANGUAGES.length - 1)
  })

  // (some languages have no emails namespace: the parity tests read these ones)
  test.each(LANGUAGES)('%s has the namespaces the AI texts live in', (lang) => {
    for (const namespace of ['common', 'appErrors', 'userAiSettings', 'aiSuggestions', 'homeView']) {
      expect([lang, namespace, typeof RESOURCES[lang][namespace]]).toEqual([lang, namespace, 'object'])
    }
  })

  test('plural forms are the ones ordinary counts reach, plus "other"', () => {
    expect(pluralFormsOf('en')).toEqual(['one', 'other'])
    expect(pluralFormsOf('es')).toEqual(['one', 'other'])
    expect(pluralFormsOf('ja')).toEqual(['other'])
    expect(pluralFormsOf('ru')).toEqual(['one', 'few', 'many', 'other'])
  })

  test('the Cyrillic languages are found by script', () => {
    expect(usesCyrillic('ru')).toBe(true)
    expect(usesCyrillic('mn')).toBe(true)
    expect(usesCyrillic('en')).toBe(false)
    expect(usesCyrillic('ja')).toBe(false)
    expect(CYRILLIC_LANGUAGES.every((lang) => LANGUAGES.includes(lang))).toBe(true)
  })

  test('every language has the keys and placeholders of English in a real group', () => {
    for (const lang of LANGUAGES) {
      expect([lang, diffWithDefaultLanguage(lang, 'common.aiBatch')]).toEqual([
        lang,
        { missing: [], extra: [], placeholders: [] },
      ])
    }
  })

  test('the diff names a missing key, an extra key and a changed placeholder', () => {
    const group = RESOURCES.es.common.aiBatch
    const [firstKey, secondKey] = Object.keys(RESOURCES.en.common.aiBatch).filter(
      (key) => typeof RESOURCES.en.common.aiBatch[key] === 'string'
    )
    const saved = { first: group[firstKey], second: group[secondKey] }
    try {
      delete group[firstKey]
      group.extraKey = 'extra'
      group[secondKey] = `${saved.second} {{notInEnglish}}`
      expect(diffWithDefaultLanguage('es', 'common.aiBatch')).toEqual({
        missing: [firstKey],
        extra: ['extraKey'],
        placeholders: [secondKey],
      })
    } finally {
      group[firstKey] = saved.first
      group[secondKey] = saved.second
      delete group.extraKey
    }
    expect(diffWithDefaultLanguage('es', 'common.aiBatch')).toEqual({ missing: [], extra: [], placeholders: [] })
  })
})
