import { Objects, RecordUpdater, SystemError } from '@openforis/arena-core'

import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import { NodeValues } from '@core/record/nodeValues'
import { NodeValueFormatter } from '@core/record/nodeValueFormatter'
import * as Validation from '@core/validation/validation'

import * as RecordManager from '@server/modules/record/manager/recordManager'

const checkRootKeysSpecified = ({ rootKeyDefs, rootKeyValuesFormatted }) => {
  const emptyRootKeyValueIndex = rootKeyValuesFormatted.findIndex(Objects.isEmpty)
  if (emptyRootKeyValueIndex >= 0) {
    const keyName = NodeDef.getName(rootKeyDefs[emptyRootKeyValueIndex])
    throw new SystemError(Validation.messageKeys.dataImport.recordKeyMissingOrInvalid, { keyName })
  }
}

const getRecordSummaryKey = ({ survey, rootKeyDefs, record }) =>
  NodeValues.getFastEqualityCompositeKey({
    nodeDefs: rootKeyDefs,
    getKey: (rootKeyDef) =>
      NodeValues.getFastEqualityKeyWithoutRecordContext({
        survey,
        nodeDef: rootKeyDef,
        value: record[A.camelize(NodeDef.getName(rootKeyDef))],
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
 * @param {!object} params.survey - The survey object.
 * @param {!Array<object>} params.rootKeyDefs - The root entity key node defs.
 * @param {!Array<object>} params.recordsSummary - The records summary list to index.
 * @returns {Map<string, Array<object>>|null} - The index, or null if it cannot be built safely.
 */
const buildRecordsSummaryIndex = ({ survey, rootKeyDefs, recordsSummary }) => {
  if (!rootKeyDefs.every((rootKeyDef) => NodeValues.isTypeFastIndexable(NodeDef.getType(rootKeyDef)))) {
    return null
  }
  const index = new Map()
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

const findRecordSummariesMatchingKeysByIndex = ({ survey, rootKeyDefs, valuesByDefUuid, index }) => {
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

const findRecordSummariesMatchingKeysByScan = ({ survey, rootKeyDefs, valuesByDefUuid, recordsSummary }) =>
  recordsSummary.filter((record) =>
    rootKeyDefs.every((rootKeyDef) => {
      const keyValueInRecord = record[A.camelize(NodeDef.getName(rootKeyDef))]
      const keyValueInRow = valuesByDefUuid[NodeDef.getUuid(rootKeyDef)]

      return NodeValues.isValueEqual({
        survey,
        nodeDef: rootKeyDef,
        value: keyValueInRecord,
        valueSearch: keyValueInRow,
      })
    })
  )

const fetchOrCreateRecord = async ({ valuesByDefUuid, context, tx, flushCallback, currentRecord = null }) => {
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
      user,
      survey,
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
