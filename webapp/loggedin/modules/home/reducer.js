import { combineReducers } from 'redux'

import surveyList from './surveyList/reducer'
import surveyCreate from './surveyCreate/reducer'
import collectImportReport from './collectImportReport/reducer'
import recordsSummary from './dashboard/recordsSummary/reducer'

import * as SurveyListState from './surveyList/surveyListState'
import * as SurveyCreateState from './surveyCreate/surveyCreateState'
import * as CollectImportReportState from './collectImportReport/collectImportReportState'
import * as RecordsSummaryState from './dashboard/recordsSummary/recordsSummaryState'

export default combineReducers({
  [SurveyListState.stateKey]: surveyList,
  [SurveyCreateState.stateKey]: surveyCreate,
  [CollectImportReportState.stateKey]: collectImportReport,
  [RecordsSummaryState.stateKey]: recordsSummary,
})