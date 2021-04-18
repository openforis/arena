import { combineReducers } from 'redux'

import { NotificationReducer, NotificationState } from './notification'
import { LoaderReducer, LoaderState } from './loader'
import { DialogConfirmReducer, DialogConfirmState } from './dialogConfirm'
import { RecordReducer, RecordState } from './record'
import { SurveyFormReducer, SurveyFormState } from './surveyForm'
import { ExportCsvDataReducer, ExportCsvDataState } from './exportCsvData'
import { ChainReducer } from './chain'

export default combineReducers({
  [NotificationState.stateKey]: NotificationReducer,
  [LoaderState.stateKey]: LoaderReducer,
  [DialogConfirmState.stateKey]: DialogConfirmReducer,
  [RecordState.stateKey]: RecordReducer,
  [SurveyFormState.stateKey]: SurveyFormReducer,
  [ExportCsvDataState.stateKey]: ExportCsvDataReducer,
  chain: ChainReducer,
})
