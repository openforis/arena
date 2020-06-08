import { exportReducer } from '@webapp/utils/reduxUtils'

import * as DialogConfirmActions from './actions'
import * as DialogConfirmState from './state'

const actionHandlers = {
  [DialogConfirmActions.DIALOG_CONFIRM_SHOW]: (_state, { key, params, onOk, onCancel }) =>
    DialogConfirmState.show({ key, params, onOk, onCancel }),

  [DialogConfirmActions.DIALOG_CONFIRM_HIDE]: DialogConfirmState.hide,
}

export default exportReducer(actionHandlers)
