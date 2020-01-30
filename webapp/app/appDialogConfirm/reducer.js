import { exportReducer } from '@webapp/utils/reduxUtils'

import { appDialogConfirmShow, appDialogConfirmHide } from './actions'

import * as AppDialogConfirmState from './appDialogConfirmState'

const actionHandlers = {
  [appDialogConfirmShow]: (_state, { messageKey, messageParams, onOk, onCancel }) =>
    AppDialogConfirmState.show(messageKey, messageParams, onOk, onCancel),

  [appDialogConfirmHide]: AppDialogConfirmState.hide,
}

export default exportReducer(actionHandlers)
