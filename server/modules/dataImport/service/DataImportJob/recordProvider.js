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
    throw new SystemError(Validation.messageKeys.dataImport.recordKeyMissing, { keyName })
  }
}

const fetchOrCreateRecord = async ({ valuesByDefUuid, currentRecord, context, tx }) => {
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

  const recordSummariesMatchingKeys = recordsSummary.filter((record) =>
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
    if (dryRun) {
      const { record: recordCreated } = await RecordUpdater.createRootEntity({
        survey,
        record: recordToInsert,
        sideEffect: true,
      })
      record = recordCreated
    } else {
      record = await RecordManager.insertRecord(user, Survey.getId(survey), recordToInsert, true, tx)
      record = await RecordManager.initNewRecord({ user, survey, record, createMultipleEntities: false }, tx)
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
    const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid }, tx)

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
