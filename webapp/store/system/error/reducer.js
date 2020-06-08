import { exportReducer } from '@webapp/utils/reduxUtils'

import * as SystemErrorActions from './actions'
import * as SystemErrorState from './state'

const actionHandlers = {
  [SystemErrorActions.SYSTEM_ERROR_THROW]: (state, { error }) => SystemErrorState.assocSystemError(error),
}

export default exportReducer(actionHandlers, '')
