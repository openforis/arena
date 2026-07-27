import { Dates, Objects, Records, Surveys } from '@openforis/arena-core'

import { ConflictResolutionStrategy } from '@common/dataImport'
import { RecordImportAction, RecordImportActionType } from '@common/dataImport/recordImportAction'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import { NodeValueFormatter } from '@core/record/nodeValueFormatter'

/**
 * Returns the formatted values of the root entity key attributes of a record, in node def key order.
 */
export const getRecordFormattedKeyValues = ({ survey, record }: { survey: any; record: any }): any[] => {
  const rootDef = Surveys.getNodeDefRoot({ survey })
  const recordRootEntity = Records.getRoot(record)
  const recordKeyValuesByDefUuid = Records.getEntityKeyValuesByDefUuid({ survey, record, entity: recordRootEntity })
  const keyDefs = Surveys.getNodeDefKeys({ survey, nodeDef: rootDef })
  const cycle = Record.getCycle(record)
  return keyDefs.map((keyDef: any) => {
    const value = recordKeyValuesByDefUuid[NodeDef.getUuid(keyDef)]
    return NodeValueFormatter.format({ survey, cycle, nodeDef: keyDef, value })
  })
}

/**
 * Same as getRecordFormattedKeyValues, but returns the values keyed by node def uuid,
 * so consumers don't need to rely on key def ordering.
 */
export const getRecordFormattedKeyValuesByDefUuid = ({
  survey,
  record,
}: {
  survey: any
  record: any
}): { [nodeDefUuid: string]: any } => {
  const rootDef = Surveys.getNodeDefRoot({ survey })
  const recordRootEntity = Records.getRoot(record)
  const recordKeyValuesByDefUuid = Records.getEntityKeyValuesByDefUuid({ survey, record, entity: recordRootEntity })
  const keyDefs = Surveys.getNodeDefKeys({ survey, nodeDef: rootDef })
  const cycle = Record.getCycle(record)
  return keyDefs.reduce((acc: { [nodeDefUuid: string]: any }, keyDef: any) => {
    const nodeDefUuid = NodeDef.getUuid(keyDef)
    const value = recordKeyValuesByDefUuid[nodeDefUuid]
    acc[nodeDefUuid] = NodeValueFormatter.format({ survey, cycle, nodeDef: keyDef, value })
    return acc
  }, {})
}

const findExistingRecordSummaryWithSameKeys = ({
  survey,
  record,
  existingRecordsSummary,
}: {
  survey: any
  record: any
  existingRecordsSummary: any[]
}): any => {
  const rootDef = Surveys.getNodeDefRoot({ survey })
  const keyDefs = Surveys.getNodeDefKeys({ survey, nodeDef: rootDef })
  const recordSummaryKeyProps = keyDefs.map((keyDef: any) => A.camelize(NodeDef.getName(keyDef)))
  const recordKeyValues = getRecordFormattedKeyValues({ survey, record })
  const recordSummariesWithSameKeys = existingRecordsSummary.filter((recordSummary: any) => {
    const recordSummaryKeyValues = recordSummaryKeyProps.map((key: string) => recordSummary[key])
    return Objects.isEqual(recordKeyValues, recordSummaryKeyValues)
  })
  return recordSummariesWithSameKeys[0]
}

/**
 * Finds the existing record (summary) matching the given imported record: first by uuid,
 * then (only when the conflict resolution strategy is "merge") by key attribute values.
 */
export const findExistingRecordSummary = ({
  survey,
  record,
  existingRecordsSummary,
  conflictResolutionStrategy,
}: {
  survey: any
  record: any
  existingRecordsSummary: any[]
  conflictResolutionStrategy: string
}): any => {
  const recordUuid = Record.getUuid(record)
  const existingRecordWithSameUuid = existingRecordsSummary.find(
    (recordSummary: any) => Record.getUuid(recordSummary) === recordUuid
  )
  if (existingRecordWithSameUuid) {
    return existingRecordWithSameUuid
  }
  if (ConflictResolutionStrategy.merge === conflictResolutionStrategy) {
    return findExistingRecordSummaryWithSameKeys({ survey, record, existingRecordsSummary })
  }
  return null
}

/**
 * Determines what action will be taken for the given imported record, given a possible existing match
 * and the chosen conflict resolution strategy. This mirrors exactly the branching logic used to actually
 * perform the import, so that a generated preview/summary can never disagree with the real import.
 */
export const determineRecordAction = ({
  record,
  existingRecordSummary,
  conflictResolutionStrategy,
}: {
  record: any
  existingRecordSummary: any
  conflictResolutionStrategy: string
}): { action: RecordImportActionType; existingRecordUuid: string | null } => {
  if (!existingRecordSummary) {
    return { action: RecordImportAction.insert, existingRecordUuid: null }
  }

  const recordUuid = Record.getUuid(record)
  const existingRecordUuid = Record.getUuid(existingRecordSummary)
  const updatingExistingRecordWithSameUuid = recordUuid === existingRecordUuid

  if (conflictResolutionStrategy === ConflictResolutionStrategy.skipExisting) {
    return { action: RecordImportAction.skip, existingRecordUuid }
  }

  if (
    conflictResolutionStrategy === ConflictResolutionStrategy.overwriteIfUpdated ||
    (conflictResolutionStrategy === ConflictResolutionStrategy.merge && updatingExistingRecordWithSameUuid)
  ) {
    const willUpdate = Dates.isAfter(
      Record.getDateModified(record) as any,
      Record.getDateModified(existingRecordSummary) as any
    )
    return { action: willUpdate ? RecordImportAction.overwrite : RecordImportAction.skip, existingRecordUuid }
  }

  if (conflictResolutionStrategy === ConflictResolutionStrategy.merge) {
    return { action: RecordImportAction.merge, existingRecordUuid }
  }

  return { action: RecordImportAction.skip, existingRecordUuid }
}
