import {
  exportReducer,
  assocActionProps,
  dissocStateProps
} from '../appUtils/reduxUtils'

import {
  loginError,
  loginSuccess
} from './actions'

const actionHandlers = {

  [loginError]: assocActionProps,

  [loginSuccess]: (state, action) => dissocStateProps(state, 'errorMessage')

}

export default exportReducer(actionHandlers)