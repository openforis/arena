import { exportReducer } from '@webapp/utils/reduxUtils'

import * as ErrorActionsTypes from './actionTypes'

const actionHandlers = {
  [ErrorActionsTypes.APP_ERROR_THROW]: (state, { payload: { error } }) => error,
}

export default exportReducer(actionHandlers)
