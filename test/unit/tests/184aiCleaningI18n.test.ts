import en from '@core/i18n/resources/en'
import es from '@core/i18n/resources/es'
import fr from '@core/i18n/resources/fr'
import ja from '@core/i18n/resources/ja'
import mn from '@core/i18n/resources/mn'
import pt from '@core/i18n/resources/pt'
import ru from '@core/i18n/resources/ru'

import { NodesBatchMessageKeys } from '@server/modules/record/service/update/nodesBatch/nodesBatchTypes'

type Resources = Record<string, any>

const languages: [string, Resources][] = [
  ['en', en],
  ['es', es],
  ['fr', fr],
  ['ja', ja],
  ['mn', mn],
  ['pt', pt],
  ['ru', ru],
]

/**
 * Returns the dotted paths of the string leaves of an object, sorted.
 * @param {object} obj - The object.
 * @param {string} prefix - Path prefix.
 * @returns {string[]} The paths.
 */
const keyPaths = (obj: object, prefix = ''): string[] =>
  Object.entries(obj)
    .flatMap(([key, value]) =>
      value && typeof value === 'object' ? keyPaths(value, `${prefix}${key}.`) : [`${prefix}${key}`]
    )
    .sort()

/**
 * Resolves a dotted path in an object.
 * @param {object} obj - The object.
 * @param {string} path - The path.
 * @returns {any} The value, or undefined.
 */
const getPath = (obj: object, path: string): any =>
  path.split('.').reduce((acc: any, key) => (acc == null ? undefined : acc[key]), obj)

/**
 * Resolves an i18n key such as 'appErrors:record.lockTimeout' (no namespace = common).
 * @param {Resources} resources - The resources of one language.
 * @param {string} key - The key.
 * @returns {any} The text, or undefined.
 */
const resolveKey = (resources: Resources, key: string): any => {
  const [namespace, path] = key.includes(':') ? key.split(':') : ['common', key]
  return getPath(resources[namespace] ?? {}, path)
}

/**
 * Returns the {{placeholders}} of a text, sorted.
 * @param {string} text - The text.
 * @returns {string[]} The placeholder names.
 */
const placeholders = (text: string): string[] =>
  Array.from(String(text).matchAll(/{{\s*(\w+)\s*}}/g), (match) => match[1]).sort()

const cleaningKeys = [
  'area',
  'badge.fixes',
  'badge.noErrors',
  'badge.stillInvalid',
  'card.applySelected',
  'card.applying',
  'card.counts',
  'card.empty',
  'card.newErrors',
  'card.retryFailed',
  'empty',
  'result.applied',
  'result.conflict',
  'result.failed',
  'result.skipped',
  'rowAction.askAssistant',
  'rowAction.question',
].sort()

const toolNames = ['validation_summarize', 'validation_list', 'record_getValues', 'records_proposeEdits']

const errorKeys = [
  ...Object.values(NodesBatchMessageKeys),
  'validationErrors:nodeValueParser.attributeNotEditable',
  'validationErrors:nodeValueParser.unsupportedType',
]

describe('cleaning translations', () => {
  test('en has exactly the aiCleaning keys used by the code', () => {
    expect(keyPaths(en.common.aiCleaning)).toEqual(cleaningKeys)
  })

  test('every language has the same aiCleaning keys, non-empty, with the placeholders of en', () => {
    for (const [lang, resources] of languages) {
      const section = resources.common.aiCleaning
      expect([lang, keyPaths(section)]).toEqual([lang, cleaningKeys])
      for (const path of cleaningKeys) {
        const value = getPath(section, path)
        expect([lang, path, String(value).trim().length > 0]).toEqual([lang, path, true])
        expect([lang, path, placeholders(value)]).toEqual([
          lang,
          path,
          placeholders(getPath(en.common.aiCleaning, path)),
        ])
      }
    }
  })

  test('every language labels the four cleaning tools', () => {
    for (const [lang, resources] of languages) {
      for (const name of toolNames) {
        const label = resources.common.aiAssistant?.tools?.[name]
        expect([lang, name, typeof label === 'string' && label.trim().length > 0]).toEqual([lang, name, true])
      }
    }
  })

  test('every error key of the batch endpoint and of the parser exists in every language, with the placeholders of en', () => {
    for (const [lang, resources] of languages) {
      for (const key of errorKeys) {
        const value = resolveKey(resources, key)
        expect([lang, key, typeof value]).toEqual([lang, key, 'string'])
        expect([lang, key, placeholders(value)]).toEqual([lang, key, placeholders(resolveKey(en, key))])
      }
    }
  })

  test('the en error texts use the params the code passes', () => {
    expect(placeholders(resolveKey(en, 'appErrors:record.nodeNotInRecord'))).toEqual(['recordUuid'])
    expect(placeholders(resolveKey(en, 'appErrors:record.nodesBatchInvalid'))).toEqual(['reason'])
    expect(placeholders(resolveKey(en, 'validationErrors:nodeValueParser.attributeNotEditable'))).toEqual([
      'attributeName',
    ])
    expect(placeholders(resolveKey(en, 'validationErrors:nodeValueParser.unsupportedType'))).toEqual([
      'attributeName',
      'type',
    ])
    expect(placeholders(resolveKey(en, 'aiCleaning.card.counts'))).toEqual(['applied', 'conflict', 'failed'])
    expect(placeholders(resolveKey(en, 'aiCleaning.card.applying'))).toEqual(['done', 'total'])
  })
})
