import { combineReducers } from 'redux'

import { NotificationReducer, NotificationState } from './notification'
import { LoaderReducer, LoaderState } from './loader'
import { DialogConfirmReducer, DialogConfirmState } from './dialogConfirm'
import { RecordReducer, RecordState } from './record'
import { SurveyFormReducer, SurveyFormState } from './surveyForm'

export default combineReducers({
  [NotificationState.stateKey]: NotificationReducer,
  [LoaderState.stateKey]: LoaderReducer,
  [DialogConfirmState.stateKey]: DialogConfirmReducer,
  [RecordState.stateKey]: RecordReducer,
  [SurveyFormState.stateKey]: SurveyFormReducer,
})
