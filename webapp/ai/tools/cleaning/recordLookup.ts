import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { AiToolFailure } from '@webapp/ai/tools/toolFailure'

import type { CleaningApi } from './cleaningApi'

/**
 * Returns a key value as text (the tool schema gives strings and numbers).
 * @param {unknown} value - The key value.
 */
const toKeyText = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value) ?? ''
}

/**
 * Returns true when a records summary item has exactly the given key values.
 * @param {object} params - Parameters.
 * @param {object} params.item - Records summary item (key columns in keysObj).
 * @param {object[]} params.keyDefs - Root key definitions.
 * @param {object} params.keys - Key values by attribute name.
 * @returns {boolean} Whether all keys match.
 */
const matchesKeys = ({ item, keyDefs, keys }: { item: any; keyDefs: any[]; keys: Record<string, unknown> }) =>
  keyDefs.every((keyDef) => {
    const actual = String(item.keysObj?.[NodeDefTable.getColumnName(keyDef)] ?? '')
    const wanted = toKeyText(keys[NodeDef.getName(keyDef)])
    // the server search ignores case, so text keys do too
    return NodeDef.getType(keyDef) === NodeDef.nodeDefType.text
      ? actual.trim().toLowerCase() === wanted.trim().toLowerCase()
      : actual === wanted
  })

const PAGE_SIZE = 100
const MAX_PAGES = 5

/**
 * Collects the records matching all the keys, paging through the search results up to a cap.
 * @param {object} params - Parameters.
 * @param {CleaningApi} params.api - Cleaning API.
 * @param {object} params.search - Search request (surveyId, cycle, search text, signal).
 * @param {Function} params.isMatch - Tells whether a summary item matches.
 * @returns {Promise<{matching: object[], complete: boolean}>} The matches and whether all pages were read.
 */
const collectMatches = async ({
  api,
  search,
  isMatch,
}: {
  api: CleaningApi
  search: { surveyId: number; cycle: string; search: string; signal?: AbortSignal }
  isMatch: (item: any) => boolean
}) => {
  const matching: any[] = []
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const items = await api.searchRecordsSummary({ ...search, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
    matching.push(...items.filter(isMatch))
    if (items.length < PAGE_SIZE) return { matching, complete: true }
  }
  return { matching, complete: false }
}

/**
 * Finds the UUID of the record with the given root key values (all keys, exact match).
 * @param {object} params - Parameters.
 * @param {CleaningApi} params.api - Cleaning API.
 * @param {object} params.keys - Key values by key attribute name.
 * @returns {Promise<object>} { recordUuid }; throws an AiToolFailure when no single record has these keys.
 */
export const findRecordUuidByKeys = async ({
  api,
  survey,
  surveyId,
  cycle,
  keys: keysGiven,
  signal,
}: {
  api: CleaningApi
  survey: any
  surveyId: number
  cycle: string
  keys: Record<string, unknown>
  signal?: AbortSignal
}) => {
  const keyDefs = Survey.getNodeDefRootKeys(survey)
  const keyNames = keyDefs.map(NodeDef.getName)
  // a small model wraps the names in stray tokens (<|"|>name<|"|>): only the characters of a name are kept
  const given = Object.fromEntries(Object.entries(keysGiven).map(([name, value]) => [name.replace(/\W/g, ''), value]))
  // keys of other entities (e.g. of a tree) do not find a record: they are left out
  const keys = Object.fromEntries(
    keyNames.filter((name: string) => name in given).map((name: string) => [name, given[name]])
  )
  if (keyDefs.length === 0 || Object.keys(keys).length !== keyNames.length) {
    throw new AiToolFailure('recordKeysInvalid', `Give all the record key attributes: ${keyNames.join(', ')}.`)
  }
  const { matching, complete } = await collectMatches({
    api,
    search: { surveyId, cycle, search: toKeyText(keys[keyNames[0]]), signal },
    isMatch: (item) => matchesKeys({ item, keyDefs, keys }),
  })
  if (matching.length > 1) {
    throw new AiToolFailure(
      'recordAmbiguous',
      'Several records have these keys: use validation_list to get their UUIDs.'
    )
  }
  if (!complete) {
    throw new AiToolFailure(
      'recordSearchTooBroad',
      'Too many records match the first key. Give the values of all the keys.'
    )
  }
  if (matching.length === 0) throw new AiToolFailure('recordNotFound', 'No record of the current cycle has these keys.')
  return { recordUuid: matching[0].uuid as string }
}
