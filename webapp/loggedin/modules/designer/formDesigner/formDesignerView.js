import React from 'react'
import { connect } from 'react-redux'

import SurveyFormView from '@webapp/loggedin/surveyViews/surveyForm/surveyFormView'
import RecordView from '@webapp/loggedin/surveyViews/record/recordView'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'
import * as RecordState from '@webapp/loggedin/surveyViews/record/recordState'
import * as Authorizer from '@core/auth/authorizer'

const FormDesignerView = props => {
  const { canEditDef, recordPreviewUuid } = props

  return recordPreviewUuid ? (
    <RecordView canEditDef={canEditDef} />
  ) : (
    <SurveyFormView edit={true} draft={true} canEditDef={canEditDef} />
  )
}

const mapStateToProps = state => {
  const user = AppState.getUser(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)

  return {
    canEditDef: Authorizer.canEditSurvey(user, surveyInfo),
    recordPreviewUuid: RecordState.getRecordUuidPreview(state),
  }
}

export default connect(mapStateToProps)(FormDesignerView)
