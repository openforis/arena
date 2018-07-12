import { exportReducer, assocActionProps } from '../app-utils/reduxUtils'

import {
  appStatusChange,
  appUserLogout
} from './actions'

import { loginSuccess } from '../login/actions'

import { appState } from './app'

const actionHandlers = {

  [appStatusChange]: assocActionProps,

  [loginSuccess]: assocActionProps,

  [appUserLogout]: (state, action) => appState.logoutUser(state)

}

export default exportReducer(actionHandlers)
