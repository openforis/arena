import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActionTypes } from '@webapp/store/system/actionTypes'

import { UserTwoFactorDeviceActionTypes } from './actionTypes'

const actionHandlers = {
  [SystemActionTypes.SYSTEM_INIT]: (state, { user }) => user || state,
  [SystemActionTypes.SYSTEM_RESET]: () => ({}),

  [UserTwoFactorDeviceActionTypes.USER_TWO_FACTOR_DEVICE_UPDATE]: (state, { device }) => ({ ...state, ...device }),
  [UserTwoFactorDeviceActionTypes.USER_TWO_FACTOR_DEVICE_RESET]: () => ({}),
}

export default exportReducer(actionHandlers)
