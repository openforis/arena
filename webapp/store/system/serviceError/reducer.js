import { exportReducer } from '@webapp/utils/reduxUtils'

import * as ServiceErrorActions from './actions'
import * as ServiceErrorState from './state'
import * as SystemActions from '../../system/actions'

const actionHandlers = {
  [SystemActions.SYSTEM_INIT]: () => ({}),

  [ServiceErrorActions.SERVICE_ERROR_CREATE]: (state, { error }) => ServiceErrorState.assocAppError(error)(state),
  [ServiceErrorActions.SERVICE_ERROR_DELETE]: (state, { error }) => ServiceErrorState.dissocAppError(error)(state),
}

export default exportReducer(actionHandlers, [])
