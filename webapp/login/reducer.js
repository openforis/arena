import { exportReducer } from '../utils/reduxUtils'

import * as LoginState from './loginState'

import {
  loginUserActionUpdate,
  loginErrorUpdate,
} from './actions'

const actionHandlers = {

  [loginUserActionUpdate]: (state, { action }) => LoginState.assocUserAction(action)(state),

  [loginErrorUpdate]: (state, { message }) => LoginState.assocError(message)(state),
}

export default exportReducer(actionHandlers)