import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import axios from 'axios'

import i18n from '@core/i18n/i18nFactory'
import { UserTwoFactorDevice } from '@core/userTwoFactorDevice'
import * as Validation from '@core/validation/validation'

import { FormItem, Input } from '@webapp/components/form/Input'
import { Button, ButtonSave, QRCode } from '@webapp/components'
import { TooltipNew } from '@webapp/components/TooltipNew'

export const UserTwoFactorDeviceDetails = () => {
  const { uuid: deviceUuid } = useParams()
  const isNew = !deviceUuid
  const [device, setDevice] = useState(isNew ? {} : null)
  const [authenticatorCodeOne, setAuthenticatorCodeOne] = useState('')
  const [authenticatorCodeTwo, setAuthenticatorCodeTwo] = useState('')
  const [error, setError] = useState(null)
  const validation = useMemo(() => Validation.getValidation(device || {}), [device])
  const deviceName = UserTwoFactorDevice.getDeviceName(device || {})
  const secret = UserTwoFactorDevice.getSecret(device || {})
  const otpAuthUrl = UserTwoFactorDevice.getOtpAuthUrl(device || {})
  const deviceCreated = !!otpAuthUrl

  useEffect(() => {
    let isMounted = true
    if (deviceUuid) {
      axios
        .get(`/api/2fa/device/${deviceUuid}`)
        .then(({ data: fetchedDevice }) => {
          setDevice(fetchedDevice)
        })
        .catch((error) => {
          if (isMounted) {
            setError(i18n.t('userTwoFactorDeviceView:error.fetchDevice', { message: error.message }))
          }
        })
    }
    return () => {
      isMounted = false
    }
  }, [deviceUuid])

  const onCreateClick = useCallback(async () => {
    const { data: createdDevice } = await axios.post('/api/2fa/device/add', { deviceName })
    setDevice(createdDevice)
  }, [deviceName])

  const onAuthenticatorCodeOneChange = useCallback((value) => {
    setAuthenticatorCodeOne(value)
  }, [])

  const onAuthenticatorCodeTwoChange = useCallback((value) => {
    setAuthenticatorCodeTwo(value)
  }, [])

  const onDeviceNameChange = useCallback((value) => {
    setDevice((prevDevice) => ({ ...(prevDevice || {}), [UserTwoFactorDevice.keys.deviceName]: value }))
  }, [])

  const onBackClick = useCallback(() => {
    globalThis.history.back()
  }, [])

  if (deviceUuid && !device) {
    if (error) {
      return <div className="error">{error}</div>
    }
    return '...' // fetching device details
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
            <FormItem label={i18n.t('userTwoFactorDeviceView:authenticatorCodeOne')}>
              <Input onChange={onAuthenticatorCodeOneChange} value={authenticatorCodeOne} />
            </FormItem>
            <FormItem label={i18n.t('userTwoFactorDeviceView:authenticatorCodeTwo')}>
              <Input onChange={onAuthenticatorCodeTwoChange} value={authenticatorCodeTwo} />
            </FormItem>
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
