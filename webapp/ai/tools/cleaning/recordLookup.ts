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
  keyDefs.every(
    (keyDef) =>
      String(item.keysObj?.[NodeDefTable.getColumnName(keyDef)] ?? '') === String(keys[NodeDef.getName(keyDef)])
  )

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
  const items = await api.searchRecordsSummary({ surveyId, cycle, search: String(keys[keyNames[0]]), signal })
  const matching = items.filter((item) => matchesKeys({ item, keyDefs, keys }))
  if (matching.length === 0) return toolError('recordNotFound', 'No record of the current cycle has these keys.')
  if (matching.length > 1)
    return toolError('recordAmbiguous', 'Several records have these keys: use validation_list to get their UUIDs.')
  return { recordUuid: matching[0].uuid as string }
}
