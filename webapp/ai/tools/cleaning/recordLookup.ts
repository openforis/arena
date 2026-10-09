import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import { toolError } from '@webapp/ai/tools/analysis/toolResults'

import type { CleaningApi } from './cleaningApi'

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
    const wanted = String(keys[NodeDef.getName(keyDef)])
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
 * @param {object} params.survey - The survey.
 * @param {number} params.surveyId - Survey id.
 * @param {string} params.cycle - Cycle key.
 * @param {object} params.keys - Key values by key attribute name.
 * @param {AbortSignal} [params.signal] - Abort signal.
 * @returns {Promise<object>} { recordUuid } or a tool error.
 */
export const findRecordUuidByKeys = async ({
  api,
  survey,
  surveyId,
  cycle,
  keys,
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
  const givenNames = Object.keys(keys)
  if (
    keyDefs.length === 0 ||
    givenNames.length !== keyNames.length ||
    !keyNames.every((name: string) => givenNames.includes(name))
  ) {
    return toolError('recordKeysInvalid', `Give exactly the record key attributes: ${keyNames.join(', ')}.`)
  }
  const { matching, complete } = await collectMatches({
    api,
    search: { surveyId, cycle, search: String(keys[keyNames[0]]), signal },
    isMatch: (item) => matchesKeys({ item, keyDefs, keys }),
  })
  if (matching.length > 1)
    return toolError('recordAmbiguous', 'Several records have these keys: use validation_list to get their UUIDs.')
  if (!complete) {
    return toolError('recordSearchTooBroad', 'Too many records match the first key. Give the values of all the keys.')
  }
  if (matching.length === 0) return toolError('recordNotFound', 'No record of the current cycle has these keys.')
  return { recordUuid: matching[0].uuid as string }
}
