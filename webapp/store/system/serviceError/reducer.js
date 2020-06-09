import { exportReducer } from '@webapp/utils/reduxUtils'

import { appErrorCreate, appErrorDelete } from './actions'

import * as ErrorsState from './state'

const actionHandlers = {
  [appErrorCreate]: (state, { error }) => ErrorsState.assocAppError(error)(state),

  [appErrorDelete]: (state, { error }) => ErrorsState.dissocAppError(error)(state),
}

export default exportReducer(actionHandlers)
