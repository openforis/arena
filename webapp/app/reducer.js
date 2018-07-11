import { exportReducer, assocActionParams } from '../app-utils/reducerUtils'

import {
  appStatusChange,
  appUserLogout
} from './actions'

import { loginSuccess } from '../login/actions'

import { appState } from './app'

const actionHandlers = {

  [appStatusChange]: (state, action) => assocActionParams(state, action),

  [loginSuccess]: (state, action) => assocActionParams(state, action),

  [appUserLogout]: (state, action) => appState.logoutUser(state)

}

export default exportReducer(actionHandlers)
