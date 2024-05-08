import { exportReducer } from '@webapp/utils/reduxUtils'

import { FileUploadDialogActions } from './actions'
import { FileUploadDialogState } from './state'

const actionHandlers = {
  [FileUploadDialogActions.FILE_UPLOAD_DIALOG_OPEN]: (_state, params) => FileUploadDialogState.create(params),

  [FileUploadDialogActions.FILE_UPLOAD_DIALOG_CLOSE]: FileUploadDialogState.reset,
}

export const FileUploadDialogReducer = exportReducer(actionHandlers)
