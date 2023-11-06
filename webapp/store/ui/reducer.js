import { combineReducers } from 'redux'

import { FileUploadDialogReducer, FileUploadDialogState } from './fileUploadDialog'
import { NotificationReducer, NotificationState } from './notification'
import { LoaderReducer, LoaderState } from './loader'
import { DialogConfirmReducer, DialogConfirmState } from './dialogConfirm'
import { RecordReducer, RecordState } from './record'
import { SurveyFormReducer, SurveyFormState } from './surveyForm'
import { ChainReducer } from './chain'

export default combineReducers({
  [FileUploadDialogState.stateKey]: FileUploadDialogReducer,
  [NotificationState.stateKey]: NotificationReducer,
  [LoaderState.stateKey]: LoaderReducer,
  [DialogConfirmState.stateKey]: DialogConfirmReducer,
  [RecordState.stateKey]: RecordReducer,
  [SurveyFormState.stateKey]: SurveyFormReducer,
  chain: ChainReducer,
})
