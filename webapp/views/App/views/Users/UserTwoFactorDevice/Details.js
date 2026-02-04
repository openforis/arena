import React, { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router'

import { UserTwoFactorDevice } from '@core/userTwoFactorDevice'
import * as Validation from '@core/validation/validation'

import { FormItem, Input } from '@webapp/components/form/Input'
import { UserTwoFactorDeviceActions } from '@webapp/store/user2fa'
import { UserTwoFactorDeviceActionTypes } from '@webapp/store/user2fa/actionTypes'
import { useUserTwoFactorDevice } from '@webapp/store/user2fa/hooks'
import { Button, ButtonSave } from '@webapp/components'

export const UserTwoFactorDeviceDetails = () => {
  const { deviceUuid } = useParams()
  const dispatch = useDispatch()
  const device = useUserTwoFactorDevice()
  const validation = Validation.getValidation(device)
  const deviceName = UserTwoFactorDevice.getDeviceName(device)

  useEffect(() => {
    if (deviceUuid) {
      dispatch(UserTwoFactorDeviceActions.fetchUserTwoFactorDevice({ uuid: deviceUuid }))
    } else {
      dispatch({ type: UserTwoFactorDeviceActionTypes.USER_TWO_FACTOR_DEVICE_RESET })
    }
  }, [dispatch, deviceUuid])

  const onDeviceNameChange = useCallback(
    (value) => {
      dispatch({
        type: UserTwoFactorDeviceActionTypes.USER_TWO_FACTOR_DEVICE_UPDATE,
        device: { ...device, [UserTwoFactorDevice.keys.deviceName]: value },
      })
    },
    [device, dispatch]
  )

  const onBackClick = useCallback(() => {
    window.history.back()
  }, [])

  const onSendClick = useCallback(() => {
    dispatch(UserTwoFactorDeviceActions.addUserTwoFactorDevice({ navigate, deviceName }))
  }, [dispatch, deviceName])

  if (deviceUuid && !device) {
    return '...'
  }

  return (
    <div>
      <FormItem label="userTwoFactorDeviceView:deviceName">
        <Input
          onChange={onDeviceNameChange}
          value={deviceName}
          validation={Validation.getFieldValidation(UserTwoFactorDevice.keys.deviceName)(validation)}
        />
      </FormItem>

      <div className="button-bar">
        <Button label="common.back" onClick={onBackClick} variant="outlined" />
        <ButtonSave
          className="save-btn"
          disabled={Validation.isNotValid(validation)}
          label="userTwoFactorDeviceView:create.label"
          onClick={onSendClick}
        />
      </div>
    </div>
  )
}
