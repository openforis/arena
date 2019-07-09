import { combineReducers } from 'redux'

import surveyList from './surveyList/reducer'
import surveyCreate from './surveyCreate/reducer'
import collectImportReport from './collectImportReport/reducer'

import * as SurveyListState from './surveyList/surveyListState'
import * as SurveyCreateState from './surveyCreate/surveyCreateState'
import * as CollectImportReportState from './collectImportReport/collectImportReportState'

export default combineReducers({
  [SurveyListState.stateKey]: surveyList,
  [SurveyCreateState.stateKey]: surveyCreate,
  [CollectImportReportState.stateKey]: collectImportReport,
})