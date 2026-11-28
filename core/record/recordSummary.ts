import type { ArenaAnyNodeDef } from '@openforis/arena-core'

import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as A from '@core/arena'

import { keys } from './_record/recordKeys'

// record summary: record props with the root entity key values camelized as props
type RecordSummaryObject = Record<string, unknown>

// value of a key or summary attribute, read from a data table column
export type RecordKeyValue = string | number | boolean | null

const getKeyValue =
  (keyDefName: string) =>
  (record: RecordSummaryObject): RecordKeyValue | undefined => {
    const keyProp = A.camelize(keyDefName)
    return record[keyProp] as RecordKeyValue | undefined
  }

/**
 * Returns the value of a root key attribute from the keys object of a record summary.
 * Unlike getKeyValue, it cannot clash with the record props (e.g. a key named survey_id vs surveyId).
 */
const getKeyValueFromKeysObj =
  (keyDef: ArenaAnyNodeDef) =>
  (record: object): RecordKeyValue | undefined => {
    const keysObj = ((record as RecordSummaryObject)[keys.keysObj] ?? {}) as Record<string, RecordKeyValue>
    return keysObj[NodeDefTable.getColumnName(keyDef)]
  }

export const RecordSummary = {
  getKeyValue,
  getKeyValueFromKeysObj,
}
