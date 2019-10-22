import { exportReducer } from '../../utils/reduxUtils'

import {
  appErrorCreate,
  appErrorDelete,
  systemErrorThrow,
} from './actions'

import * as AppState from '../../app/appState'

const actionHandlers = {
  [appErrorCreate]: (state, { error }) => AppState.assocAppError(error)(state),

  [appErrorDelete]: (state, { error }) => AppState.dissocAppError(error)(state),

  [systemErrorThrow]: (state, { error }) => AppState.assocSystemError(error)(state),
}

export default exportReducer(actionHandlers)
