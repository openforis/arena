import { exportReducer } from '@webapp/utils/reduxUtils'

import * as SystemActions from '@webapp/store/system/actions'
import * as SystemStatusState from './state'

const actionHandlers = {
  [SystemActions.SYSTEM_INIT]: () => SystemStatusState.systemStatus.ready,
}

export default exportReducer(actionHandlers)
