import type { ArenaAnyNodeDef } from '@openforis/arena-core'

import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import { keys } from './_record/recordKeys'

// record summary: record props, with the root entity key values in the keys object (by data column name)
type RecordSummaryObject = Record<string, unknown>

// value of a key or summary attribute, read from a data table column
export type RecordKeyValue = string | number | boolean | null

/**
 * Returns the value of a root key attribute from the keys object of a record summary.
 * The key values are not read from the camelized top-level props: they can clash with the record ones
 * (e.g. a key named survey_id vs surveyId).
 */
const getKeyValueFromKeysObj =
  (keyDef: ArenaAnyNodeDef) =>
  (record: object): RecordKeyValue | undefined => {
    const keysObj = ((record as RecordSummaryObject)[keys.keysObj] ?? {}) as Record<string, RecordKeyValue>
    return keysObj[NodeDefTable.getColumnName(keyDef)]
  }

export const RecordSummary = {
  getKeyValueFromKeysObj,
}
