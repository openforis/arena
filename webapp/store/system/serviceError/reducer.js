import { exportReducer } from '@webapp/utils/reduxUtils'

import * as ServiceErrorActions from './actions'
import * as ServiceErrorState from './state'

const actionHandlers = {
  [ServiceErrorActions.appErrorCreate]: (state, { error }) => ServiceErrorState.assocAppError(error)(state),

  [ServiceErrorActions.appErrorDelete]: (state, { error }) => ServiceErrorState.dissocAppError(error)(state),
}

export default exportReducer(actionHandlers)
