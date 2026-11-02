import { Dates, Objects, Records, Surveys } from '@openforis/arena-core'

import { ConflictResolutionStrategy } from '@common/dataImport'
import { RecordImportAction, RecordImportActionType } from '@common/dataImport/recordImportAction'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import SystemError from '@core/systemError'
import { NodeValueFormatter } from '@core/record/nodeValueFormatter'
import { NodeValues } from '@core/record/nodeValues'

import { CategoryItemProviderDefault } from '@server/modules/category/manager/categoryItemProviderDefault'

const formatKeyValue = async ({
  survey,
  cycle,
  keyDef,
  value,
}: {
  survey: any
  cycle: any
  keyDef: any
  value: any
}): Promise<any> => {
  const itemUuid = NodeDef.isCode(keyDef) && value ? NodeValues.getValueItemUuid(value) : null
  // items of big categories are not in the survey ref data
  const categoryItem = itemUuid
    ? await CategoryItemProviderDefault.getOrFetchItem({ survey, nodeDef: keyDef, itemUuid })
    : null
  const node = categoryItem ? { refData: { categoryItem } } : null
  return NodeValueFormatter.format({ survey, cycle, nodeDef: keyDef, node, value } as any)
}

/**
 * Returns the formatted values of the root entity key attributes of a record, keyed by node def uuid,
 * so consumers don't need to rely on key def ordering.
 */
export const getRecordFormattedKeyValuesByDefUuid = async ({
  survey,
  record,
}: {
  survey: any
  record: any
}): Promise<{ [nodeDefUuid: string]: any }> => {
  const rootDef = Surveys.getNodeDefRoot({ survey })
  const recordRootEntity = Records.getRoot(record)
  const recordKeyValuesByDefUuid = Records.getEntityKeyValuesByDefUuid(survey, recordRootEntity)(record)
  const keyDefs = Surveys.getNodeDefKeys({ survey, nodeDef: rootDef })
  const cycle = Record.getCycle(record)
  const keyValuesFormatted: { [nodeDefUuid: string]: any } = {}
  for (const keyDef of keyDefs) {
    const nodeDefUuid = NodeDef.getUuid(keyDef)
    const value = recordKeyValuesByDefUuid[nodeDefUuid]
    keyValuesFormatted[nodeDefUuid] = await formatKeyValue({ survey, cycle, keyDef, value }) // NOSONAR
  }
  return keyValuesFormatted
}

/**
 * Same as getRecordFormattedKeyValuesByDefUuid, but returns the values as an array, in node def key order.
 */
export const getRecordFormattedKeyValues = async ({ survey, record }: { survey: any; record: any }): Promise<any[]> =>
  Object.values(await getRecordFormattedKeyValuesByDefUuid({ survey, record }))

const findExistingRecordSummaryWithSameKeys = async ({
  survey,
  record,
  existingRecordsSummary,
}: {
  survey: any
  record: any
  existingRecordsSummary: any[]
}): Promise<any> => {
  const rootDef = Surveys.getNodeDefRoot({ survey })
  const keyDefs = Surveys.getNodeDefKeys({ survey, nodeDef: rootDef })
  const recordSummaryKeyProps = keyDefs.map((keyDef: any) => A.camelize(NodeDef.getName(keyDef)))
  const recordKeyValues = await getRecordFormattedKeyValues({ survey, record })
  return existingRecordsSummary.find((recordSummary: any) => {
    const recordSummaryKeyValues = recordSummaryKeyProps.map((key: string) => recordSummary[key])
    return Objects.isEqual(recordKeyValues, recordSummaryKeyValues)
  })
}

/**
 * Finds the existing record (summary) matching the given imported record: first by uuid,
 * then (only when the conflict resolution strategy is "merge") by key attribute values.
 */
export const findExistingRecordSummary = async ({
  survey,
  record,
  existingRecordsSummary,
  conflictResolutionStrategy,
}: {
  survey: any
  record: any
  existingRecordsSummary: any[]
  conflictResolutionStrategy: string
}): Promise<any> => {
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
 * Throws an error if the record would be merged into a different record with the same keys
 * and the survey security settings do not allow it.
 */
export const determineRecordAction = async ({
  survey,
  record,
  existingRecordSummary,
  conflictResolutionStrategy,
}: {
  survey: any
  record: any
  existingRecordSummary: any
  conflictResolutionStrategy: string
}): Promise<{ action: RecordImportActionType; existingRecordUuid: string | null }> => {
  if (!existingRecordSummary) {
    return { action: RecordImportAction.insert, existingRecordUuid: null }
  }

  const existingRecordUuid = Record.getUuid(existingRecordSummary)

  if (conflictResolutionStrategy === ConflictResolutionStrategy.skipExisting) {
    return { action: RecordImportAction.skip, existingRecordUuid }
  }

  if (conflictResolutionStrategy === ConflictResolutionStrategy.overwriteIfUpdated) {
    const willUpdate = Dates.isAfter(
      Record.getDateModified(record) as any,
      Record.getDateModified(existingRecordSummary) as any
    )
    return { action: willUpdate ? RecordImportAction.overwrite : RecordImportAction.skip, existingRecordUuid }
  }

  if (conflictResolutionStrategy === ConflictResolutionStrategy.merge) {
    if (
      existingRecordUuid !== Record.getUuid(record) &&
      !Surveys.isRecordsMergeWithSameKeysAllowed(Survey.getSurveyInfo(survey))
    ) {
      const recordKeyValues = await getRecordFormattedKeyValues({ survey, record })
      throw new SystemError('dataImport.recordMergeWithSameKeysNotAllowed', { recordKeyValues })
    }
    // applies both to a same-uuid record diverged on two clients, and to a different-uuid record matched by keys
    return { action: RecordImportAction.merge, existingRecordUuid }
  }

  return { action: RecordImportAction.skip, existingRecordUuid }
}
