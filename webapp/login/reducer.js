import { exportReducer } from '@webapp/utils/reduxUtils'

import * as LoginState from './loginState'

import { loginEmailUpdate, loginUserActionUpdate, loginErrorUpdate } from './actions'

const actionHandlers = {
  [loginEmailUpdate]: (state, { email }) => LoginState.assocEmail(email)(state),

  [loginUserActionUpdate]: (state, { action }) => LoginState.assocUserAction(action)(state),

  [loginErrorUpdate]: (state, { message }) => LoginState.assocError(message)(state),
}

export default exportReducer(actionHandlers)
