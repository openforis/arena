import { exportReducer, assocActionProps } from '../appUtils/reduxUtils'

import {
  appStatusChange,
  appUserLogout
} from './actions'

import { loginSuccess } from '../login/actions'
import { appState } from './app'

const actionHandlers = {

  [appStatusChange]: assocActionProps,

  // user and current survey are properties of app state
  [loginSuccess]: assocActionProps,

  [appUserLogout]: (state, action) => appState.logoutUser(state),

}

export default exportReducer(actionHandlers)
