import React, { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useParams } from 'react-router'

import { UserTwoFactorDevice } from '@core/userTwoFactorDevice'
import * as Validation from '@core/validation/validation'

import { FormItem, Input } from '@webapp/components/form/Input'
import { Button, ButtonSave, QRCode } from '@webapp/components'

import {
  UserTwoFactorDeviceActions,
  UserTwoFactorDeviceActionTypes,
  useUserTwoFactorDevice,
} from '@webapp/store/user2fa'
import i18n from '@core/i18n/i18nFactory'
import Tooltip from '@webapp/components/tooltip'
import { TooltipNew } from '@webapp/components/TooltipNew'

export const UserTwoFactorDeviceDetails = () => {
  const { uuid: deviceUuid } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const device = useUserTwoFactorDevice()
  const isNew = !deviceUuid
  const validation = Validation.getValidation(device)
  const deviceName = UserTwoFactorDevice.getDeviceName(device)
  const secret = UserTwoFactorDevice.getSecret(device)
  const otpAuthUrl = UserTwoFactorDevice.getOtpAuthUrl(device)
  const deviceCreated = !!otpAuthUrl

  useEffect(() => {
    if (deviceUuid) {
      dispatch(UserTwoFactorDeviceActions.fetchUserTwoFactorDevice({ deviceUuid }))
    } else {
      dispatch({ type: UserTwoFactorDeviceActionTypes.USER_TWO_FACTOR_DEVICE_RESET })
    }
    return () => {
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
    globalThis.history.back()
  }, [])

  const onCreateClick = useCallback(() => {
    dispatch(UserTwoFactorDeviceActions.addUserTwoFactorDevice({ navigate, deviceName }))
  }, [dispatch, deviceName, navigate])

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

      {isNew && deviceCreated && (
        <ol>
          <li>
            <h3>{i18n.t('userTwoFactorDeviceView:steps.installAuthenticatorApp.title')}</h3>
            <p>{i18n.t('userTwoFactorDeviceView:steps.installAuthenticatorApp.description')}</p>
          </li>
          <li>
            <h3>{i18n.t('userTwoFactorDeviceView:steps.scanCode.title')}</h3>
            <p>{i18n.t('userTwoFactorDeviceView:steps.scanCode.description')}</p>
            <p>
              <div style={{ marginTop: '20px' }}>
                <h3>{i18n.t('userTwoFactorDeviceView:scanQrCode')}</h3>
                <div>
                  <QRCode value={otpAuthUrl} />
                </div>
                <TooltipNew title={secret}>
                  <span>{i18n.t('userTwoFactorDeviceView:showSecretKey')}</span>
                </TooltipNew>
              </div>
            </p>
          </li>
          <li>
            <h3>{i18n.t('userTwoFactorDeviceView:steps.typeAuthenticatorCodes.title')}</h3>
            <p>{i18n.t('userTwoFactorDeviceView:steps.typeAuthenticatorCodes.description')}</p>
          </li>
        </ol>
      )}

      <div className="button-bar">
        <Button label="common.back" onClick={onBackClick} variant="outlined" />
        {isNew && (
          <ButtonSave
            className="save-btn"
            disabled={Validation.isNotValid(validation)}
            label="userTwoFactorDeviceView:create.label"
            onClick={onCreateClick}
          />
        )}
      </div>
    </div>
  )
}
