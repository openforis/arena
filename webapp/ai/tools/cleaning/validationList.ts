import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as RecordValidationReportItem from '@core/record/recordValidationReportItem'
import * as Authorizer from '@core/auth/authorizer'

import { CleaningI18n, getRowMessages, getRowRecordKeys } from './validationRows'

/**
 * Returns true when the user can edit the record of a report row (same check as the report's row icon).
 * @param {object} params - Parameters.
 * @param {object} params.surveyInfo - Survey info.
 * @param {object} params.user - The user.
 * @param {object} params.row - The report row.
 * @returns {boolean} Whether the record is editable.
 */
const canEditRowRecord = ({ surveyInfo, user, row }: { surveyInfo: any; user: any; row: any }): boolean =>
  Survey.isPublished(surveyInfo) &&
  Authorizer.canEditRecord(user, {
    [Record.keys.surveyUuid]: Survey.getUuid(surveyInfo),
    [Record.keys.uuid]: RecordValidationReportItem.getRecordUuid(row),
    [Record.keys.step]: RecordValidationReportItem.getRecordStep(row),
    [Record.keys.ownerUuid]: RecordValidationReportItem.getRecordOwnerUuid(row),
  } as any)

/**
 * Converts validation report rows into the items returned to the model.
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey.
 * @param {object[]} params.rows - Report rows.
 * @param {object} params.user - The user.
 * @param {CleaningI18n} params.i18n - Translator.
 * @param {string} params.lang - Survey language.
 * @returns {object[]} The items.
 */
export const toValidationListItems = ({
  survey,
  rows,
  user,
  i18n,
  lang,
}: {
  survey: any
  rows: any[]
  user: any
  i18n: CleaningI18n
  lang: string
}) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  return rows.map((row) => ({
    recordUuid: RecordValidationReportItem.getRecordUuid(row),
    recordKeys: getRowRecordKeys({ survey, row }),
    recordStep: RecordValidationReportItem.getRecordStep(row),
    nodeUuid: RecordValidationReportItem.getNodeUuid(row),
    nodeDefUuid: RecordValidationReportItem.getNodeDefUuid(row),
    path: RecordValidationReportItem.getPath({ survey, lang, labelType: NodeDef.NodeDefLabelTypes.name })(row),
    messages: getRowMessages({ i18n, survey, row }),
    canEdit: canEditRowRecord({ surveyInfo, user, row }),
  }))
}
