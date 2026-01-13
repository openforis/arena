import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActionTypes } from '../actionTypes'
import * as SystemStatusState from './state'

const actionHandlers = {
  [SystemActionTypes.SYSTEM_INIT]: () => SystemStatusState.systemStatus.ready,
}

export default exportReducer(actionHandlers)
