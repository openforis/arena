import axios from 'axios'

import { appModuleUri, userTwoFactorDeviceModules } from '@webapp/app/appModules'

import { UserTwoFactorDeviceActionTypes } from './actionTypes'

export const addUserTwoFactorDevice =
  ({ navigate, deviceName }) =>
  async (_dispatch, _getState) => {
    const { data: device } = await axios.post('/api/2fa/device/add', { deviceName })

    navigate(`${appModuleUri(userTwoFactorDeviceModules.userTwoFactorDevice)}/${device.uuid}/`)
  }

export const fetchUserTwoFactorDevice =
  ({ uuid }) =>
  async (dispatch) => {
    const {
      data: { device },
    } = await axios.get(`/api/2fa/device/${uuid}`)

    dispatch({ type: UserTwoFactorDeviceActionTypes.USER_TWO_FACTOR_DEVICE_UPDATE, device })
  }
