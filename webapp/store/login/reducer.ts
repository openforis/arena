import { exportReducer } from '@webapp/utils/reduxUtils'
import { SystemActionTypes } from '../system/actionTypes'

import * as LoginActions from './actions'
import * as LoginState from './state'

const actionHandlers = {
  [SystemActionTypes.SYSTEM_RESET]: () => ({}),

  [LoginActions.reset]: () => ({}),

  [LoginActions.loginEmailUpdate]: (state, { email }) => LoginState.assocEmail(email)(state),

  [LoginActions.loginErrorUpdate]: (state, { message }) => LoginState.assocError(message)(state),

  [LoginActions.loginViewStateUpdate]: (state, { viewState }) => LoginState.assocViewState(viewState)(state),

  [LoginActions.loginExternalLoginUpdate]: (state, { externalLogin }) =>
    LoginState.assocExternalLogin(externalLogin)(state),
}

export default exportReducer(actionHandlers)
