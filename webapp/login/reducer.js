import { exportReducer } from '../utils/reduxUtils'

import * as LoginState from './loginState'

import {
  emailUpdate,
  loginUserActionUpdate,
  loginErrorUpdate,
} from './actions'

const actionHandlers = {

  [emailUpdate]: (state, { email }) => LoginState.assocEmail(email)(state),

  [loginUserActionUpdate]: (state, { action }) => LoginState.assocUserAction(action)(state),

  [loginErrorUpdate]: (state, { message }) => LoginState.assocError(message)(state),
}

export default exportReducer(actionHandlers)