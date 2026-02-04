import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router'

import { UserTwoFactorDeviceActions } from '@webapp/store/user2fa'
import { UserTwoFactorDeviceActionTypes } from '@webapp/store/user2fa/actionTypes'

export const UserTwoFactorDeviceDetails = () => {
  const { deviceUuid } = useParams()
  const dispatch = useDispatch()

  useEffect(() => {
    if (deviceUuid) {
      dispatch(UserTwoFactorDeviceActions.fetchUserTwoFactorDevice({ uuid: deviceUuid }))
    } else {
      dispatch({ type: UserTwoFactorDeviceActionTypes.USER_TWO_FACTOR_DEVICE_RESET })
    }
  }, [dispatch, deviceUuid])

  if (deviceUuid && !device) {
    return '...'
  }

  return <div>Form</div>
}
