import { exportReducer } from '@webapp/utils/reduxUtils'

import * as DialogConfirmActions from './actions'
import * as DialogConfirmState from './state'

const actionHandlers = {
  [DialogConfirmActions.DIALOG_CONFIRM_SHOW]: (_state, params) => DialogConfirmState.show(params),

  [DialogConfirmActions.DIALOG_CONFIRM_HIDE]: DialogConfirmState.hide,

  [DialogConfirmActions.DIALOG_CONFIRM_TEXT_CHANGE]: (state, { text }) =>
    DialogConfirmState.setStrongConfirmText(text)(state),
}

export default exportReducer(actionHandlers)
