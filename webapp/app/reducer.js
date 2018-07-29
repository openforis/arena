import { exportReducer, assocActionProps } from '../app-utils/reduxUtils'

import {
  appStatusChange,
  appUserLogout
} from './actions'

import { loginSuccess } from '../login/actions'
import { surveyCurrentUpdate } from '../survey/actions'
import { appState } from './app'

const actionHandlers = {

  [appStatusChange]: assocActionProps,

  // user and current survey are properties of app state
  [loginSuccess]: assocActionProps,

  [appUserLogout]: (state, action) => appState.logoutUser(state),

  [surveyCurrentUpdate]: assocActionProps,

}

export default exportReducer(actionHandlers)
