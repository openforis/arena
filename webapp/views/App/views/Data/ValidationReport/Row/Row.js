import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as RecordValidationReportItem from '@core/record/recordValidationReportItem'
import * as Authorizer from '@core/auth/authorizer'
import { ValidationUtils } from '@core/validation/validationUtils'

import { useI18n } from '@webapp/store/system'
import { useUser } from '@webapp/store/user'
import { useSurvey, useSurveyInfo, useSurveyPreferredLang } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import ValidationFieldMessages from '@webapp/components/validationFieldMessages'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'

const Row = (props) => {
  const { rowNo, row } = props

  const lang = useSurveyPreferredLang()
  const user = useUser()
  const survey = useSurvey()
  const surveyInfo = useSurveyInfo()
  const i18n = useI18n()

  const path = RecordValidationReportItem.getPath({ survey, lang })(row)
  const canEdit =
    Survey.isPublished(surveyInfo) &&
    Authorizer.canEditRecord(user, {
      [Record.keys.surveyUuid]: Survey.getUuid(surveyInfo),
      [Record.keys.uuid]: RecordValidationReportItem.getRecordUuid(row),
      [Record.keys.step]: RecordValidationReportItem.getRecordStep(row),
      [Record.keys.ownerUuid]: RecordValidationReportItem.getRecordOwnerUuid(row),
    })

  const validation = RecordValidationReportItem.getValidation(row)
  const jointValidationText = ValidationUtils.getJointMessage({ i18n, survey, showKeys: false })(validation)

  return (
    <>
      <div>{rowNo}</div>
      <div data-value={path}>
        <LabelWithTooltip label={path} />
      </div>
      <div
        className="validation-report__message"
        data-testid={TestId.validationReport.cellMessages}
        data-value={jointValidationText}
      >
        <ValidationFieldMessages validation={validation} showKeys={false} showIcons />
      </div>
      <div>
        <span className={`icon icon-12px icon-action ${canEdit ? 'icon-pencil2' : 'icon-eye'}`} />
      </div>
    </>
  )
}

Row.propTypes = {
  row: PropTypes.object.isRequired,
  rowNo: PropTypes.number.isRequired,
}

export default Row
