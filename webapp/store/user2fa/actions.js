import axios from 'axios'

import { UserTwoFactorDeviceActionTypes } from './actionTypes'

export const addUserTwoFactorDevice =
  ({ deviceName }) =>
  async (dispatch, _getState) => {
    const { data: device } = await axios.post('/api/2fa/device/add', { deviceName })

    dispatch({ type: UserTwoFactorDeviceActionTypes.USER_TWO_FACTOR_DEVICE_UPDATE, device })
  }

export const fetchUserTwoFactorDevice =
  ({ deviceUuid }) =>
  async (dispatch) => {
    const { data: device } = await axios.get(`/api/2fa/device/${deviceUuid}`)

    dispatch({ type: UserTwoFactorDeviceActionTypes.USER_TWO_FACTOR_DEVICE_UPDATE, device })
  }
