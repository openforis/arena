import { exportReducer } from '../app-utils/reducerUtils'

import {
  loginError,
  loginSuccess
} from './actions'

const actionHandlers = {
  [loginError]: (state, action) => ({...state, errorMessage: action.errorMessage}),

  [loginSuccess]: (state, action) => ({...state, errorMessage: null})
}
export default exportReducer(actionHandlers)