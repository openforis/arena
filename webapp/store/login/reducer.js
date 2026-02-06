import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActionTypes } from '../system/actionTypes'

import * as LoginState from './state'
import * as LoginActions from './actions'

const actionHandlers = {
  [SystemActionTypes.SYSTEM_RESET]: () => ({}),

  [LoginActions.reset]: () => ({}),

  [LoginActions.loginEmailUpdate]: (state, { email }) => LoginState.assocEmail(email)(state),

  [LoginActions.loginErrorUpdate]: (state, { message }) => LoginState.assocError(message)(state),

  [LoginActions.loginViewStateUpdate]: (state, { viewState }) => LoginState.assocViewState(viewState)(state),
}

export default exportReducer(actionHandlers)
