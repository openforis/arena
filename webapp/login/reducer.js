import { exportReducer, assocActionParams, dissocStateParams } from '../app-utils/reducerUtils'

import {
  loginError,
  loginSuccess
} from './actions'

const actionHandlers = {

  [loginError]: (state, action) => assocActionParams(state, action),

  [loginSuccess]: (state, action) => dissocStateParams(state, 'errorMessage')

}

export default exportReducer(actionHandlers)