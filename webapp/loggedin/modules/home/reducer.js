import { combineReducers } from 'redux'

import surveyCreate from './surveyCreate/reducer'
import collectImportReport from './collectImportReport/reducer'
import recordsSummary from './dashboard/recordsSummary/reducer'
import activityLog from './dashboard/activityLog/reducer'

import * as SurveyCreateState from './surveyCreate/surveyCreateState'
import * as CollectImportReportState from './collectImportReport/collectImportReportState'
import * as RecordsSummaryState from './dashboard/recordsSummary/recordsSummaryState'
import * as ActivityLogState from './dashboard/activityLog/activityLogState'

export default combineReducers({
  [SurveyCreateState.stateKey]: surveyCreate,
  [CollectImportReportState.stateKey]: collectImportReport,
  [RecordsSummaryState.stateKey]: recordsSummary,
  [ActivityLogState.stateKey]: activityLog,
})
