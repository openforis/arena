import { exportReducer, assocActionParams } from '../app-utils/reducerUtils'

import { appStatusChange } from './actions'
import { loginSuccess } from '../login/actions'

const actionHandlers = {

  [appStatusChange]: (state, action) => assocActionParams(state, action),

  [loginSuccess]: (state, action) => assocActionParams(state, action)

}

export default exportReducer(actionHandlers)
