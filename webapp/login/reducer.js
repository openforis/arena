import { exportReducer } from '../utils/reduxUtils'

import * as LoginState from './loginState'

import { loginError, loginReset } from './actions'

const actionHandlers = {

  [loginError]: (state, { message }) => LoginState.assocError(message)(state),

  [loginReset]: (state) => LoginState.assocError(null)(state)

}

export default exportReducer(actionHandlers)