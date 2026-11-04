/**
 * Sentinel-2 panel texts: every language has every English key with the same placeholders, adds only
 * plural forms, and Russian and Mongolian are written in Cyrillic.
 */
import en from '@core/i18n/resources/en/common'
import es from '@core/i18n/resources/es/common'
import fr from '@core/i18n/resources/fr/common'
import ja from '@core/i18n/resources/ja/common'
import mn from '@core/i18n/resources/mn/common'
import pt from '@core/i18n/resources/pt/common'
import ru from '@core/i18n/resources/ru/common'

type Messages = Record<string, unknown>

const LANGUAGES: Record<string, Messages> = { es, fr, ja, mn, pt, ru }
const LANGUAGE_CODES = Object.keys(LANGUAGES)
const CYRILLIC = /[Ѐ-ӿ]/
// Brand names, symbols and pure placeholders need no Cyrillic letter.
const NON_CYRILLIC_KEYS = new Set(['tab', 'percent', 'unknownValue', 'layerName', 'bandsShort.swir'])
const EXTRA_PLURAL_SUFFIX = /_(few|many)$/

/**
 * Flattens nested messages into dotted keys.
 *
 * @param {Messages} messages - Nested messages.
 * @param {string} [prefix] - Key prefix.
 * @returns {Record<string, string>} Flat messages.
 */
const flatten = (messages: Messages, prefix = ''): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') result[path] = value
    else if (value && typeof value === 'object') Object.assign(result, flatten(value as Messages, path))
  }
  return result
}

/**
 * Returns the flat `mapWorkspace.scenes` messages of a language.
 *
 * @param {Messages} resources - Default export of common.js.
 * @returns {Record<string, string>} Flat messages.
 */
const scenesOf = (resources: Messages): Record<string, string> => {
  const mapWorkspace = (resources.mapWorkspace ?? {}) as Messages
  return flatten((mapWorkspace.scenes ?? {}) as Messages)
}

/**
 * Lists the placeholders of a text, sorted.
 *
 * @param {string} text - Text.
 * @returns {string[]} Placeholder names.
 */
const placeholders = (text: string): string[] =>
  [...text.matchAll(/{{\s*([\w.]+)\s*}}/g)].map((match) => match[1]).sort()

const enScenes = scenesOf(en)

describe('Sentinel-2 scene panel translations (284)', () => {
  test('English has the panel texts', () => {
    expect(enScenes.title).toBe('Sentinel-2 scenes')
    expect(enScenes.menuSearch).toBe('Search recent Sentinel-2 scenes…')
    expect(enScenes['messages.empty']).toBe('No scenes match. Allow more cloud or a longer period.')
    expect(Object.keys(enScenes)).toHaveLength(56)
  })

  test.each(LANGUAGE_CODES)('%s has every English key with the same placeholders', (lang) => {
    const scenes = scenesOf(LANGUAGES[lang])
    for (const [key, text] of Object.entries(enScenes)) {
      expect([key, typeof scenes[key]]).toEqual([key, 'string'])
      expect([key, placeholders(scenes[key] ?? '')]).toEqual([key, placeholders(text)])
    }
  })

  test.each(LANGUAGE_CODES)('%s adds only _few and _many plural forms', (lang) => {
    const scenes = scenesOf(LANGUAGES[lang])
    const extraKeys = Object.keys(scenes).filter((key) => !(key in enScenes))
    for (const key of extraKeys) {
      const otherKey = key.replace(EXTRA_PLURAL_SUFFIX, '_other')
      expect([key, EXTRA_PLURAL_SUFFIX.test(key) && otherKey in enScenes]).toEqual([key, true])
      expect([key, placeholders(scenes[key])]).toEqual([key, placeholders(enScenes[otherKey] ?? '')])
    }
  })

  test.each(['ru', 'mn'])('%s is written in Cyrillic', (lang) => {
    const scenes = scenesOf(LANGUAGES[lang])
    const latinOnly = Object.entries(scenes)
      .filter(([key, text]) => !NON_CYRILLIC_KEYS.has(key) && !CYRILLIC.test(text))
      .map(([key]) => key)
    expect(latinOnly).toEqual([])
  })

  test('Russian has _few and _many next to every plural', () => {
    const scenes = scenesOf(ru)
    const pluralBases = Object.keys(enScenes)
      .filter((key) => key.endsWith('_one'))
      .map((key) => key.slice(0, -'_one'.length))
    expect(pluralBases).toHaveLength(5)
    for (const base of pluralBases) {
      expect([base, typeof scenes[`${base}_few`], typeof scenes[`${base}_many`]]).toEqual([base, 'string', 'string'])
    }
  })

  test('translations are not English copies', () => {
    for (const lang of LANGUAGE_CODES) {
      const scenes = scenesOf(LANGUAGES[lang])
      expect([lang, scenes.title === enScenes.title, scenes['messages.empty'] === enScenes['messages.empty']]).toEqual([
        lang,
        false,
        false,
      ])
    }
  })
})
