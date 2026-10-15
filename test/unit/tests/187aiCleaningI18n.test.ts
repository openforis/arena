import { NodesBatchMessageKeys } from '@server/modules/record/service/update/nodesBatch/nodesBatchTypes'
import {
  getPath,
  LANGUAGES,
  leafPaths,
  placeholdersOf as placeholders,
  resolveKey,
  RESOURCES,
} from '../utils/i18nParity'

const en = RESOURCES.en

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
    expect(leafPaths(en.common.aiCleaning)).toEqual(cleaningKeys)
  })

  test('every language has the same aiCleaning keys, non-empty, with the placeholders of en', () => {
    for (const lang of LANGUAGES) {
      const section = RESOURCES[lang].common.aiCleaning
      expect([lang, leafPaths(section)]).toEqual([lang, cleaningKeys])
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
    for (const lang of LANGUAGES) {
      for (const name of toolNames) {
        const label = RESOURCES[lang].common.aiAssistant?.tools?.[name]
        expect([lang, name, typeof label === 'string' && label.trim().length > 0]).toEqual([lang, name, true])
      }
    }
  })

  test('every error key of the batch endpoint and of the parser exists in every language, with the placeholders of en', () => {
    for (const lang of LANGUAGES) {
      for (const key of errorKeys) {
        const value = resolveKey(lang, key)
        expect([lang, key, typeof value]).toEqual([lang, key, 'string'])
        expect([lang, key, placeholders(value)]).toEqual([lang, key, placeholders(resolveKey('en', key))])
      }
    }
  })

  test('the en error texts use the params the code passes', () => {
    expect(placeholders(resolveKey('en', 'appErrors:record.nodeNotInRecord'))).toEqual(['recordUuid'])
    expect(placeholders(resolveKey('en', 'appErrors:record.nodesBatchInvalid'))).toEqual(['reason'])
    expect(placeholders(resolveKey('en', 'validationErrors:nodeValueParser.attributeNotEditable'))).toEqual([
      'attributeName',
    ])
    expect(placeholders(resolveKey('en', 'validationErrors:nodeValueParser.unsupportedType'))).toEqual([
      'attributeName',
      'type',
    ])
    expect(placeholders(resolveKey('en', 'aiCleaning.card.counts'))).toEqual(['applied', 'conflict', 'failed'])
    expect(placeholders(resolveKey('en', 'aiCleaning.card.applying'))).toEqual(['done', 'total'])
  })
})
