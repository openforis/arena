import { exportReducer } from '@webapp/utils/reduxUtils'

import * as ServiceErrorActions from './actions'
import * as ServiceErrorState from './state'

const actionHandlers = {
  [ServiceErrorActions.SERVICE_ERROR_CREATE]: (state, { error }) => ServiceErrorState.assocAppError(error)(state),
  [ServiceErrorActions.SERVICE_ERROR_DELETE]: (state, { error }) => ServiceErrorState.dissocAppError(error)(state),
}

export default exportReducer(actionHandlers, [])
