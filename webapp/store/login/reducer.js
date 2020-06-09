import { exportReducer } from '@webapp/utils/reduxUtils'

import { UserActions } from '@webapp/store/user'

import * as LoginState from './state'
import * as LoginActions from './actions'

const actionHandlers = {
  [LoginActions.loginEmailUpdate]: (state, { email }) => LoginState.assocEmail(email)(state),

  [LoginActions.loginErrorUpdate]: (state, { message }) => LoginState.assocError(message)(state),

  [UserActions.APP_USER_LOGOUT]: () => ({}),
}

export default exportReducer(actionHandlers)
