import { exportReducer, assocActionProps, dissocStateProps } from '../app-utils/reduxUtils'

import {
  loginError,
  loginSuccess
} from './actions'

const actionHandlers = {

  [loginError]: (state, action) => assocActionProps(state, action),

  [loginSuccess]: (state, action) => dissocStateProps(state, 'errorMessage')

}

export default exportReducer(actionHandlers)