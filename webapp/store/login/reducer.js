import { exportReducer } from '@webapp/utils/reduxUtils'

import * as AppActions from '@webapp/app/actions'

import * as LoginState from './state'
import * as LoginActions from './actions'

const actionHandlers = {
  [LoginActions.loginEmailUpdate]: (state, { email }) => LoginState.assocEmail(email)(state),

  [LoginActions.loginErrorUpdate]: (state, { message }) => LoginState.assocError(message)(state),

  [AppActions.appUserLogout]: () => ({}),
}

export default exportReducer(actionHandlers)
