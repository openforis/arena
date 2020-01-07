import { exportReducer } from '@webapp/utils/reduxUtils'

import * as LoginState from './loginState'

import { loginEmailUpdate, loginErrorUpdate } from './actions'
import { appUserLogout } from '@webapp/app/actions'

const actionHandlers = {
  [loginEmailUpdate]: (state, { email }) => LoginState.assocEmail(email)(state),

  [loginErrorUpdate]: (state, { message }) => LoginState.assocError(message)(state),

  [appUserLogout]: () => ({}),
}

export default exportReducer(actionHandlers)
