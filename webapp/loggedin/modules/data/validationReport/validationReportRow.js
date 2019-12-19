import React from 'react'
import { connect } from 'react-redux'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as RecordValidationReportItem from '@core/record/recordValidationReportItem'
import * as Authorizer from '@core/auth/authorizer'

import ValidationFieldMessages from '@webapp/commonComponents/validationFieldMessages'

const ValidationReportRow = props => {
  const { idx, offset, path, validation, canEdit } = props

  return (
    <>
      <div>{idx + offset + 1}</div>
      <div>{path}</div>
      <div className="validation-report__message">
        <ValidationFieldMessages validation={validation} showKeys={false} showIcons={true} />
      </div>
      <div>
        <span className={`icon icon-12px icon-action ${canEdit ? 'icon-pencil2' : 'icon-eye'}`} />
      </div>
    </>
  )
}

const mapStateToProps = (state, props) => {
  const { row } = props

  const user = AppState.getUser(state)
  const survey = SurveyState.getSurvey(state)
  const i18n = AppState.getI18n(state)

  const path = RecordValidationReportItem.getPath(survey, i18n.lang)(row)

  const surveyInfo = Survey.getSurveyInfo(survey)
  const canEdit =
    Survey.isPublished(surveyInfo) &&
    Authorizer.canEditRecord(user, {
      [Record.keys.surveyUuid]: Survey.getUuid(surveyInfo),
      [Record.keys.uuid]: RecordValidationReportItem.getRecordUuid(row),
      [Record.keys.step]: RecordValidationReportItem.getRecordStep(row),
      [Record.keys.ownerUuid]: RecordValidationReportItem.getRecordOwnerUuid(row),
    })

  return {
    path,
    validation: RecordValidationReportItem.getValidation(row),
    canEdit,
  }
}

export default connect(mapStateToProps)(ValidationReportRow)
