import { exportReducer } from '../utils/reduxUtils'

import * as LoginState from './loginState'

import {
  passwordResetUser,
  loginError,
  loginErrorReset,
  passwordResetUserReset
} from './actions'

const actionHandlers = {

  [passwordResetUser]: (state, { user }) => LoginState.assocPasswordResetUser(user)(state),

  [loginError]: (state, { message }) => LoginState.assocError(message)(state),

  [loginErrorReset]: state => LoginState.assocError(null)(state),

  [passwordResetUserReset]: state => LoginState.assocPasswordResetUser(null)(state),


  // [loginReset]: (state) => {
  //   LoginState.assocError(null)(state)
  //   return LoginState.assocPasswordResetUser(null)(state)
  // }

}

export default exportReducer(actionHandlers)