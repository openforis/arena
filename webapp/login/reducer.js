import { exportReducer } from '../utils/reduxUtils'

import * as LoginState from './loginState'

import {
  setRequiredUserAction,
  loginError,
} from './actions'

const actionHandlers = {

  [setRequiredUserAction]: (state, { action }) => LoginState.setRequiredUserAction(action)(state),

  [loginError]: (state, { message }) => LoginState.assocError(message)(state),
}

export default exportReducer(actionHandlers)