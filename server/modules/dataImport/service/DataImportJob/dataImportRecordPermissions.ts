import { ArenaRecord, Authorizer, NodeDef, NodeDefType, User } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'

import * as RecordManager from '@server/modules/record/manager/recordManager'

// see SurveyManager.fetchUserQualifierFilters
type QualifierFilter = { nodeDef: NodeDef<NodeDefType>; value: unknown }

/**
 * Determines whether the user can update an existing record with a data import, with the same rules used
 * when editing the record: edit permission (record owner and step) and record belonging to the user's group.
 * @param {object} params - The parameters.
 * @param {User} params.user - The user running the import.
 * @param {object} params.survey - The survey, with node defs loaded.
 * @param {ArenaRecord} params.record - The record (with nodes) to update.
 * @param {boolean} params.updateRecordsInAnalysis - Whether records in Analysis step can be updated.
 * @param {QualifierFilter[]} params.userQualifierFilters - The qualifier filters of the user's group (see SurveyManager.fetchUserQualifierFilters).
 * @returns {boolean} - True if the record can be updated, false otherwise.
 */
const canUpdateRecord = ({
  user,
  survey,
  record,
  updateRecordsInAnalysis,
  userQualifierFilters,
}: {
  user: User
  survey: any
  record: ArenaRecord
  updateRecordsInAnalysis: boolean
  userQualifierFilters: QualifierFilter[]
}): boolean => {
  const allowAnalysisStepEdit =
    Boolean(updateRecordsInAnalysis) && Authorizer.canAnalyzeRecords(user, Survey.getSurveyInfo(survey))
  return (
    Authorizer.canEditRecord(user, record, allowAnalysisStepEdit) &&
    RecordManager.recordMatchesQualifierFilters({ survey, record, qualifierFilters: userQualifierFilters })
  )
}

export const DataImportRecordPermissions = {
  canUpdateRecord,
}
