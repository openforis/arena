import './Details.scss'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import axios from 'axios'

import * as StringUtils from '@core/stringUtils'
import i18n from '@core/i18n/i18nFactory'
import { UserTwoFactorDevice } from '@core/userTwoFactorDevice'
import * as Validation from '@core/validation/validation'

import { Button, ButtonDelete, ButtonSave, QRCode } from '@webapp/components'
import { TooltipNew } from '@webapp/components/TooltipNew'
import { Checkbox } from '@webapp/components/form'
import { FormItem, Input } from '@webapp/components/form/Input'
import { useConfirmAsync, useNotifyError, useNotifyInfo } from '@webapp/components/hooks'

export const UserTwoFactorDeviceDetails = () => {
  const { uuid: deviceUuidParam } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirmAsync()
  const notifyInfo = useNotifyInfo()
  const notifyError = useNotifyError()
  const isNew = !deviceUuidParam
  const [device, setDevice] = useState(isNew ? {} : null)
  const [authenticatorCodeOne, setAuthenticatorCodeOne] = useState('')
  const [authenticatorCodeTwo, setAuthenticatorCodeTwo] = useState('')
  const [error, setError] = useState(null)
  const validation = useMemo(() => Validation.getValidation(device || {}), [device])
  const deviceName = UserTwoFactorDevice.getDeviceName(device || {})
  const secret = UserTwoFactorDevice.getSecret(device || {})
  const otpAuthUrl = UserTwoFactorDevice.getOtpAuthUrl(device || {})
  const deviceCreated = !!otpAuthUrl
  const deviceUuid = deviceUuidParam || UserTwoFactorDevice.getUuid(device)
  const deviceNameEditable = isNew && !deviceCreated

  useEffect(() => {
    let isMounted = true
    if (deviceUuidParam) {
      axios
        .get(`/api/2fa/device/${deviceUuidParam}`)
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
  }, [deviceUuidParam])

  const onCreateClick = useCallback(async () => {
    const { data: createdDevice } = await axios.post('/api/2fa/device/add', { deviceName })
    setDevice(createdDevice)
  }, [deviceName])

  const onValidateClick = useCallback(async () => {
    try {
      await axios.post(`/api/2fa/device/verify`, {
        deviceUuid,
        token1: authenticatorCodeOne,
        token2: authenticatorCodeTwo,
      })
      notifyInfo({ key: 'userTwoFactorDeviceView:validation.successful' })
      // navigate back to the list after successful validation
      navigate(-1)
    } catch (error) {
      notifyError({ key: 'userTwoFactorDeviceView:validation.error', params: { message: error.message } })
    }
  }, [deviceUuid, authenticatorCodeOne, authenticatorCodeTwo, notifyInfo, navigate, notifyError])

  const onDeleteClick = useCallback(async () => {
    const confirmed = await confirm({
      key: 'userTwoFactorDeviceView:deletion.confirm',
      params: { deviceName },
      okButtonLabel: 'common.delete',
    })
    if (!confirmed) return
    try {
      await axios.delete(`/api/2fa/device/remove`, { data: { deviceUuid } })
      notifyInfo({ key: 'userTwoFactorDeviceView:deletion.successful' })
      // navigate back to the list after successful deletion
      navigate(-1)
    } catch (error) {
      notifyError({ key: 'userTwoFactorDeviceView:deletion.error', params: { message: error.message } })
    }
  }, [confirm, deviceName, deviceUuid, notifyInfo, navigate, notifyError])

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
    navigate(-1)
  }, [navigate])

  if (deviceUuidParam && !device) {
    if (error) {
      return <div className="error">{error}</div>
    }
    return '...' // fetching device details
  }

  return (
    <div className="user-two-factor-device-details">
      <FormItem label="userTwoFactorDeviceView:deviceName">
        <Input
          onChange={onDeviceNameChange}
          readOnly={!deviceNameEditable}
          textTransformFunction={StringUtils.normalizeName}
          value={deviceName}
          validation={Validation.getFieldValidation(UserTwoFactorDevice.keys.deviceName)(validation)}
        />
      </FormItem>

      {!isNew && (
        <FormItem label="userTwoFactorDeviceView:enabled">
          <Checkbox checked={UserTwoFactorDevice.isEnabled(device)} disabled />
        </FormItem>
      )}

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
              <Input
                className="authenticator-code"
                onChange={onAuthenticatorCodeOneChange}
                value={authenticatorCodeOne}
              />
            </FormItem>
            <FormItem label={i18n.t('userTwoFactorDeviceView:authenticatorCodeTwo')}>
              <Input
                className="authenticator-code"
                onChange={onAuthenticatorCodeTwoChange}
                value={authenticatorCodeTwo}
              />
            </FormItem>
          </li>
        </ol>
      )}

      <div className="button-bar">
        <Button className="back btn" label="common.back" onClick={onBackClick} variant="outlined" />
        {isNew && (
          <>
            {deviceCreated ? (
              <ButtonSave
                className="save-btn"
                disabled={Validation.isNotValid(validation)}
                label="userTwoFactorDeviceView:validate.label"
                onClick={onValidateClick}
              />
            ) : (
              <ButtonSave
                className="save-btn"
                disabled={Validation.isNotValid(validation)}
                label="userTwoFactorDeviceView:create.label"
                onClick={onCreateClick}
              />
            )}
          </>
        )}
        {(!isNew || deviceCreated) && <ButtonDelete onClick={onDeleteClick} />}
      </div>
    </div>
  )
}
