import { combineReducers } from 'redux'

import { ChainReducer } from './chain'
import { DialogConfirmReducer, DialogConfirmState } from './dialogConfirm'
import { FileUploadDialogReducer, FileUploadDialogState } from './fileUploadDialog'
import { LoaderReducer, LoaderState } from './loader'
import { MessageReducer, MessageState } from './message'
import { MessageNotificationReducer, MessageNotificationState } from './messageNotification'
import { NotificationReducer, NotificationState } from './notification'
import { RecordReducer, RecordState } from './record'
import { SurveyFormReducer, SurveyFormState } from './surveyForm'
import { TablesReducer, TablesState } from './tables'

export default combineReducers({
  [FileUploadDialogState.stateKey]: FileUploadDialogReducer,
  [NotificationState.stateKey]: NotificationReducer,
  [LoaderState.stateKey]: LoaderReducer,
  [DialogConfirmState.stateKey]: DialogConfirmReducer,
  [RecordState.stateKey]: RecordReducer,
  [SurveyFormState.stateKey]: SurveyFormReducer,
  [TablesState.stateKey]: TablesReducer,
  chain: ChainReducer,
  [MessageState.stateKey]: MessageReducer,
  [MessageNotificationState.stateKey]: MessageNotificationReducer,
})
