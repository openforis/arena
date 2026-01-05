import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActionTypes } from '../system/actionTypes'

import * as LoginState from './state'
import * as LoginActions from './actions'

const actionHandlers = {
  [LoginActions.loginEmailUpdate]: (state, { email }) => LoginState.assocEmail(email)(state),

  [LoginActions.loginErrorUpdate]: (state, { message }) => LoginState.assocError(message)(state),

  [SystemActionTypes.SYSTEM_RESET]: () => ({}),
}

export default exportReducer(actionHandlers)
