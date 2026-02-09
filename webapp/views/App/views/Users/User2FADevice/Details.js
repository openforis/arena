import './Details.scss'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import axios from 'axios'

import i18n from '@core/i18n/i18nFactory'
import { User2FADevice } from '@core/user2FADevice'
import * as Validation from '@core/validation/validation'

import { Button, ButtonDelete, ButtonSave, QRCode } from '@webapp/components'
import { TooltipNew } from '@webapp/components/TooltipNew'
import { Checkbox } from '@webapp/components/form'
import { FormItem, Input } from '@webapp/components/form/Input'
import { useConfirmAsync, useNotifyError, useNotifyInfo } from '@webapp/components/hooks'

import { User2FADeviceValidator } from './user2FADeviceValidator'

export const User2FADeviceDetails = () => {
  const { uuid: deviceUuidParam } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirmAsync()
  const notifyInfo = useNotifyInfo()
  const notifyError = useNotifyError()
  const isNew = !deviceUuidParam
  const [device, setDevice] = useState(isNew ? {} : null)
  const [existingDevices, setExistingDevices] = useState([])
  const [authenticatorCodeOne, setAuthenticatorCodeOne] = useState('')
  const [authenticatorCodeTwo, setAuthenticatorCodeTwo] = useState('')
  const [error, setError] = useState(null)
  const validation = useMemo(() => Validation.getValidation(device || {}), [device])
  const deviceName = User2FADevice.getDeviceName(device || {})
  const secret = User2FADevice.getSecret(device || {})
  const otpAuthUrl = User2FADevice.getOtpAuthUrl(device || {})
  const deviceCreated = !!otpAuthUrl
  const deviceUuid = deviceUuidParam || User2FADevice.getUuid(device)
  const deviceNameEditable = isNew && !deviceCreated

  useEffect(() => {
    let isMounted = true
    if (deviceUuidParam) {
      axios
        .get(`/api/2fa/device/${deviceUuidParam}`)
        .then(({ data: fetchedDevice }) => {
          if (isMounted) {
            setDevice(fetchedDevice)
          }
        })
        .catch((error) => {
          if (isMounted) {
            setError(i18n.t('user2FADevice:error.fetchDevice', { message: error.message }))
          }
        })
    } else {
      // new device
      axios.get('/api/2fa/devices').then(({ data: { list } }) => {
        setExistingDevices(list)
        const newDeviceObj = {}
        User2FADeviceValidator.validateDevice(list)(newDeviceObj).then((nextValidation) => {
          setDevice(Validation.assocValidation(nextValidation)(newDeviceObj))
        })
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
      notifyInfo({ key: 'user2FADevice:validation.successful' })
      // navigate back to the list after successful validation
      navigate(-1)
    } catch (error) {
      notifyError({ key: 'user2FADevice:validation.error', params: { message: error.message } })
    }
  }, [deviceUuid, authenticatorCodeOne, authenticatorCodeTwo, notifyInfo, navigate, notifyError])

  const onDeleteClick = useCallback(async () => {
    const confirmed = await confirm({
      key: 'user2FADevice:deletion.confirm',
      params: { deviceName },
      okButtonLabel: 'common.delete',
    })
    if (!confirmed) return
    try {
      await axios.delete(`/api/2fa/device/remove`, { data: { deviceUuid } })
      notifyInfo({ key: 'user2FADevice:deletion.successful' })
      // navigate back to the list after successful deletion
      navigate(-1)
    } catch (error) {
      notifyError({ key: 'user2FADevice:deletion.error', params: { message: error.message } })
    }
  }, [confirm, deviceName, deviceUuid, notifyInfo, navigate, notifyError])

  const onAuthenticatorCodeOneChange = useCallback((value) => {
    setAuthenticatorCodeOne(value)
  }, [])

  const onAuthenticatorCodeTwoChange = useCallback((value) => {
    setAuthenticatorCodeTwo(value)
  }, [])

  const onDeviceNameChange = useCallback(
    (value) => {
      setDevice((prevDevice) => {
        const nextDevice = { ...(prevDevice || {}), [User2FADevice.keys.deviceName]: value }
        User2FADeviceValidator.validateDevice(existingDevices)(nextDevice).then((nextValidation) => {
          setDevice(Validation.assocValidation(nextValidation)(nextDevice))
        })
        return nextDevice
      })
    },
    [existingDevices]
  )

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
      <FormItem label="user2FADevice:deviceName">
        <Input
          onChange={onDeviceNameChange}
          readOnly={!deviceNameEditable}
          value={deviceName}
          validation={Validation.getFieldValidation(User2FADevice.keys.deviceName)(validation)}
        />
      </FormItem>

      {!isNew && (
        <FormItem label="user2FADevice:enabled">
          <Checkbox checked={User2FADevice.isEnabled(device)} disabled />
        </FormItem>
      )}

      {isNew && deviceCreated && (
        <ol>
          <li>
            <h3>{i18n.t('user2FADevice:validationSteps.installAuthenticatorApp.title')}</h3>
            <p>{i18n.t('user2FADevice:validationSteps.installAuthenticatorApp.description')}</p>
          </li>
          <li>
            <h3>{i18n.t('user2FADevice:validationSteps.scanCode.title')}</h3>
            <p>{i18n.t('user2FADevice:validationSteps.scanCode.description')}</p>
            <div className="scan-qr-code-internal-container">
              <QRCode value={otpAuthUrl} />
              <div>
                {i18n.t('user2FADevice:validationSteps.scanCode.descriptionAlternative')}
                <TooltipNew title={secret}>
                  <Button label="user2FADevice:showSecretKey" variant="text" />
                </TooltipNew>
              </div>
            </div>
          </li>
          <li>
            <h3>{i18n.t('user2FADevice:validationSteps.typeAuthenticatorCodes.title')}</h3>
            <p>{i18n.t('user2FADevice:validationSteps.typeAuthenticatorCodes.description')}</p>
            <FormItem label="user2FADevice:authenticatorCodeOne">
              <Input
                className="authenticator-code"
                onChange={onAuthenticatorCodeOneChange}
                value={authenticatorCodeOne}
              />
            </FormItem>
            <FormItem label="user2FADevice:authenticatorCodeTwo" info="user2FADevice:authenticatorCodeTwoInfo">
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
                label="user2FADevice:validation.label"
                onClick={onValidateClick}
              />
            ) : (
              <ButtonSave
                className="save-btn"
                disabled={Validation.isNotValid(validation)}
                label="user2FADevice:create.label"
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
