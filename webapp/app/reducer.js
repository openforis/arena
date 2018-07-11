import { exportReducer, assocActionParams } from '../app-utils/reducerUtils'

import {
  appStatusChange,
  appUserLogout
} from './actions'

import { loginSuccess } from '../login/actions'

import { logoutAppUser } from './app'

const actionHandlers = {

  [appStatusChange]: (state, action) => assocActionParams(state, action),

  [loginSuccess]: (state, action) => assocActionParams(state, action),

  [appUserLogout]: (state, action) => logoutAppUser(state)

}

export default exportReducer(actionHandlers)
