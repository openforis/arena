import * as A from '@core/arena'

import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActionTypes } from '../actionTypes'
import * as SystemInfoState from './state'

const actionHandlers = {
  [SystemActionTypes.SYSTEM_INIT]: (state, { appInfo, config }) => {
    const infoState = SystemInfoState.getState(state)
    const stateUpdated = A.pipe(SystemInfoState.assocAppInfo(appInfo), SystemInfoState.assocConfig(config))(infoState)
    return stateUpdated
  },
}

export default exportReducer(actionHandlers)
