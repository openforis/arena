import {
  type ArenaAnyNodeDef,
  type ArenaRecord,
  type ArenaSurvey,
  type ArenaUser,
  Objects,
  RecordUpdater,
  SystemError,
} from '@openforis/arena-core'

import { NodeValueFormatter } from '@core/record/nodeValueFormatter'
import { NodeValues } from '@core/record/nodeValues'
import * as Record from '@core/record/record'
import { RecordSummary } from '@core/record/recordSummary'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import type { DbClient } from '@server/db/db'
import { createRecordEvaluationContext } from '@server/modules/record/manager/recordEvaluationContextDefault'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import type { QualifierFilter } from '@server/modules/record/repository/qualifierFiltersSqlConditions'

import { DataImportRecordPermissions } from './dataImportRecordPermissions'

// existing record summary, with the root key values in its keys object (see RecordSummary.getKeyValueFromKeysObj)
type RecordSummaryItem = ArenaRecord & { [keyProp: string]: unknown }

// record summaries by the composite key of their root key values
type RecordsSummaryIndex = Map<string, RecordSummaryItem[]>

// the (data import) job context
type RecordProviderContext = {
  survey: ArenaSurvey
  surveyId: number
  cycle: string
  user: ArenaUser
  dryRun?: boolean
  insertNewRecords?: boolean
  updateRecordsInAnalysis?: boolean
  userQualifierFilters?: QualifierFilter[]
  recordsSummary: RecordSummaryItem[]
  recordsSummaryIndex?: RecordsSummaryIndex | null
}

const checkRootKeysSpecified = ({
  rootKeyDefs,
  rootKeyValuesFormatted,
}: {
  rootKeyDefs: ArenaAnyNodeDef[]
  rootKeyValuesFormatted: unknown[]
}) => {
  const emptyRootKeyValueIndex = rootKeyValuesFormatted.findIndex((value) => Objects.isEmpty(value))
  if (emptyRootKeyValueIndex >= 0) {
    const keyName = NodeDef.getName(rootKeyDefs[emptyRootKeyValueIndex])
    throw new SystemError(Validation.messageKeys.dataImport.recordKeyMissingOrInvalid, { keyName })
  }
}

/**
 * Throws an error if the user running the import cannot update the specified existing record.
 * @param {!object} params - The function parameters.
 * @param {!object} params.context - The import job context.
 * @param {!object} params.record - The record (with nodes) to update.
 * @param {!string} params.keyValues - The record key values (formatted), used in the error message.
 */
const checkCanUpdateRecord = ({
  context,
  record,
  keyValues,
}: {
  context: RecordProviderContext
  record: ArenaRecord
  keyValues: string
}) => {
  const { survey, updateRecordsInAnalysis, user, userQualifierFilters } = context
  if (
    !DataImportRecordPermissions.canUpdateRecord({
      user,
      survey,
      record,
      updateRecordsInAnalysis,
      userQualifierFilters,
    })
  ) {
    throw new SystemError(Validation.messageKeys.dataImport.recordNotEditable, { keyValues })
  }
}

const getRecordSummaryKey = ({
  survey,
  rootKeyDefs,
  record,
}: {
  survey: ArenaSurvey
  rootKeyDefs: ArenaAnyNodeDef[]
  record: ArenaRecord
}) =>
  NodeValues.getFastEqualityCompositeKey({
    nodeDefs: rootKeyDefs,
    getKey: (rootKeyDef) =>
      NodeValues.getFastEqualityKeyWithoutRecordContext({
        survey,
        nodeDef: rootKeyDef,
        value: RecordSummary.getKeyValueFromKeysObj(rootKeyDef)(record),
      }),
  })

/**
 * Builds a Map index of recordsSummary bucketed by root key values, so that a matching record can be
 * looked up in O(1) instead of scanning the whole array for every imported row (recordsSummary can hold
 * every existing record in the survey, and this lookup otherwise runs once per imported row).
 * Returns null when at least one root key def's type isn't supported by
 * NodeValues.getFastEqualityKeyWithoutRecordContext: callers should fall back to a full scan in that case,
 * matching the pre-existing behavior exactly (see fetchOrCreateRecord below).
 * @param {!object} params - The function parameters.
 * @param {!Array<object>} params.rootKeyDefs - The root entity key node defs.
 * @param {!Array<object>} params.recordsSummary - The records summary list to index.
 * @returns {Map<string, Array<object>>|null} - The index, or null if it cannot be built safely.
 */
const buildRecordsSummaryIndex = ({
  survey,
  rootKeyDefs,
  recordsSummary,
}: {
  survey: ArenaSurvey
  rootKeyDefs: ArenaAnyNodeDef[]
  recordsSummary: RecordSummaryItem[]
}): RecordsSummaryIndex | null => {
  if (!rootKeyDefs.every((rootKeyDef) => NodeValues.isTypeFastIndexable(NodeDef.getType(rootKeyDef)))) {
    return null
  }
  const index: RecordsSummaryIndex = new Map()
  recordsSummary.forEach((record) => {
    const { key: bucketKey } = getRecordSummaryKey({ survey, rootKeyDefs, record })
    if (bucketKey === null) return // record has an empty root key value: never matches, skip indexing it
    const bucket = index.get(bucketKey)
    if (bucket) {
      bucket.push(record)
    } else {
      index.set(bucketKey, [record])
    }
  })
  return index
}

const findRecordSummariesMatchingKeysByIndex = ({
  survey,
  rootKeyDefs,
  valuesByDefUuid,
  index,
}: {
  survey: ArenaSurvey
  rootKeyDefs: ArenaAnyNodeDef[]
  valuesByDefUuid: Record<string, any>
  index: RecordsSummaryIndex
}) => {
  const { key: bucketKey } = NodeValues.getFastEqualityCompositeKey({
    nodeDefs: rootKeyDefs,
    getKey: (rootKeyDef) =>
      NodeValues.getFastEqualityKeyWithoutRecordContext({
        survey,
        nodeDef: rootKeyDef,
        value: valuesByDefUuid[NodeDef.getUuid(rootKeyDef)],
      }),
  })
  if (bucketKey === null) return [] // empty value in the row: never matches, same as the full-scan comparator
  return index.get(bucketKey) ?? []
}

const findRecordSummariesMatchingKeysByScan = ({
  survey,
  rootKeyDefs,
  valuesByDefUuid,
  recordsSummary,
}: {
  survey: ArenaSurvey
  rootKeyDefs: ArenaAnyNodeDef[]
  valuesByDefUuid: Record<string, any>
  recordsSummary: RecordSummaryItem[]
}): RecordSummaryItem[] =>
  recordsSummary.filter((record) =>
    rootKeyDefs.every((rootKeyDef) => {
      const keyValueInRecord = RecordSummary.getKeyValueFromKeysObj(rootKeyDef)(record)
      const keyValueInRow = valuesByDefUuid[NodeDef.getUuid(rootKeyDef)]

      return NodeValues.isValueEqual({
        survey,
        nodeDef: rootKeyDef,
        value: keyValueInRecord,
        valueSearch: keyValueInRow,
      })
    })
  )

const fetchOrCreateRecord = async ({
  valuesByDefUuid,
  context,
  tx,
  flushCallback,
  currentRecord = null,
}: {
  valuesByDefUuid: Record<string, any>
  context: RecordProviderContext
  tx: DbClient
  flushCallback: () => Promise<void>
  currentRecord?: ArenaRecord | null
}) => {
  const { cycle, dryRun, insertNewRecords, recordsSummary, survey, surveyId, updateRecordsInAnalysis, user } = context

  // fetch record by root entity key values
  const rootKeyDefs = Survey.getNodeDefRootKeys(survey)

  const rootKeyValuesFormatted = rootKeyDefs.map((rootKeyDef) =>
    NodeValueFormatter.format({
      survey,
      nodeDef: rootKeyDef,
      value: valuesByDefUuid[NodeDef.getUuid(rootKeyDef)],
    })
  )

  checkRootKeysSpecified({ rootKeyDefs, rootKeyValuesFormatted })

  if (context.recordsSummaryIndex === undefined) {
    // built lazily on first row and cached on the (per-job, mutable) context for subsequent rows;
    // not enumerable so it doesn't leak into job context logging/serialization
    Object.defineProperty(context, 'recordsSummaryIndex', {
      value: buildRecordsSummaryIndex({ survey, rootKeyDefs, recordsSummary }),
      enumerable: false,
      writable: true,
    })
  }
  const { recordsSummaryIndex } = context

  const recordSummariesMatchingKeys = recordsSummaryIndex
    ? findRecordSummariesMatchingKeysByIndex({ survey, rootKeyDefs, valuesByDefUuid, index: recordsSummaryIndex })
    : findRecordSummariesMatchingKeysByScan({ survey, rootKeyDefs, valuesByDefUuid, recordsSummary })

  const keyNameValuePairs = rootKeyDefs
    .map((keyDef, index) => {
      const name = NodeDef.getName(keyDef)
      const value = rootKeyValuesFormatted[index]
      return `${name}=${value}`
    })
    .join(', ')

  if (insertNewRecords) {
    // check if record with the same key values already exists
    if (recordSummariesMatchingKeys.length === 1) {
      throw new SystemError(Validation.messageKeys.dataImport.recordAlreadyExisting, { keyValues: keyNameValuePairs })
    }
    const recordToInsert = Record.newRecord(user, cycle)
    let record = null
    const { record: recordCreated } = await RecordUpdater.createRootEntity({
      ...createRecordEvaluationContext({ user, survey }),
      record: recordToInsert,
      sideEffect: true,
    })
    record = recordCreated

    if (!dryRun) {
      const recordInserted = await RecordManager.insertRecord(user, Survey.getId(survey), record, true, tx)
      record.id = recordInserted.id
    }
    return {
      newRecord: true,
      record,
    }
  }

  // insertNewRecords === false : updating existing record

  if (recordSummariesMatchingKeys.length > 1) {
    throw new SystemError(Validation.messageKeys.dataImport.multipleRecordsMatchingKeys, {
      keyValues: keyNameValuePairs,
    })
  }
  const recordSummary = recordSummariesMatchingKeys[0]
  if (!recordSummary) {
    throw new SystemError(Validation.messageKeys.dataImport.recordNotFound, { keyValues: keyNameValuePairs })
  }

  if (!updateRecordsInAnalysis && Record.isInAnalysisStep(recordSummary)) {
    throw new SystemError(Validation.messageKeys.dataImport.recordInAnalysisStepCannotBeUpdated, {
      keyValues: keyNameValuePairs,
    })
  }

  const recordUuid = Record.getUuid(recordSummary)

  // avoid loading the same record multiple times
  if (Record.getUuid(currentRecord) !== recordUuid) {
    // fetch record
    await flushCallback() // flush before fetching a record: nodes could have been inserted/updated/deleted before
    const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid, user }, tx)

    checkCanUpdateRecord({ context, record, keyValues: keyNameValuePairs })

    return {
      newRecord: false,
      record,
    }
  }
  // no need to fetch record; use the current one
  return {
    newRecord: false,
    record: currentRecord,
  }
}

export const DataImportJobRecordProvider = {
  fetchOrCreateRecord,
}
