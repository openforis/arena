import './Details.scss'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import i18n from '@core/i18n/i18nFactory'
import { User2FADevice } from '@core/user2FADevice'
import * as Validation from '@core/validation/validation'
import * as User from '@core/user/user'

import { Button, ButtonDelete, ButtonSave, QRCode } from '@webapp/components'
import { TooltipNew } from '@webapp/components/TooltipNew'
import { Checkbox } from '@webapp/components/form'
import { FormItem, Input } from '@webapp/components/form/Input'
import { useConfirmAsync, useNotifyError, useNotifyInfo } from '@webapp/components/hooks'

import * as API from '@webapp/service/api'
import { useUser } from '@webapp/store/user'

import { User2FADeviceValidator } from './user2FADeviceValidator'

export const User2FADeviceDetails = () => {
  const { uuid: deviceUuidParam } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirmAsync()
  const user = useUser()

  const notifyInfo = useNotifyInfo()
  const notifyError = useNotifyError()
  const isNew = !deviceUuidParam
  const [device, setDevice] = useState(isNew ? {} : null)
  const [existingDevices, setExistingDevices] = useState([])
  const [authenticatorCodeOne, setAuthenticatorCodeOne] = useState('')
  const [authenticatorCodeTwo, setAuthenticatorCodeTwo] = useState('')
  const [error, setError] = useState(null)
  const validation = useMemo(() => Validation.getValidation(device), [device])
  const deviceName = User2FADevice.getDeviceName(device)
  const secret = User2FADevice.getSecret(device)
  const deviceBackupCodes = User2FADevice.getBackupCodes(device)
  const otpAuthUrl = User2FADevice.getOtpAuthUrl(device)
  const deviceCreated = !!otpAuthUrl
  const deviceUuid = deviceUuidParam || User2FADevice.getUuid(device)
  const deviceNameEditable = isNew && !deviceCreated
  const deviceNameFinal = deviceName ? `Arena: ${deviceName} - ${User.getEmail(user)}` : ''

  useEffect(() => {
    let isMounted = true
    if (deviceUuidParam) {
      API.getDevice(deviceUuidParam)
        .then((fetchedDevice) => {
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
      API.getDevices()
        .then((list) => {
          if (isMounted) {
            setExistingDevices(list)
            const newDeviceObj = {}
            User2FADeviceValidator.validateDevice(list)(newDeviceObj).then((nextValidation) => {
              if (isMounted) {
                setDevice(Validation.assocValidation(nextValidation))
              }
            })
          }
        })
        .catch((error) => {
          if (isMounted) {
            setError(i18n.t('user2FADevice:error.fetchDevice', { message: error.message }))
          }
        })
    }
    return () => {
      isMounted = false
    }
  }, [deviceUuidParam])

  const onCreateClick = useCallback(async () => {
    const createdDevice = await API.addDevice({ deviceName })
    setDevice(createdDevice)
  }, [deviceName])

  const showConfirmBackupCodesGenerated = useCallback(
    async ({ newDevice, backupCodes }) => {
      await confirm({
        key: newDevice ? 'user2FADevice:creationSuccessful.message' : 'user2FADevice:backupCodesRegenerated.message',
        params: { deviceName, backupCodes: backupCodes.map((code) => `- ${code}`).join('  \n') },
        headerText: newDevice ? 'user2FADevice:creationSuccessful.title' : 'user2FADevice:backupCodesRegenerated.title',
        strongConfirm: true,
        strongConfirmRequiredText: 'copied',
        okButtonLabel: 'common.confirm',
        dismissable: false,
      })
    },
    [confirm, deviceName]
  )

  const onValidateClick = useCallback(async () => {
    try {
      await API.verifyDevice({ deviceUuid, token1: authenticatorCodeOne, token2: authenticatorCodeTwo })
      // navigate back to the list after successful validation
      navigate(-1)

      showConfirmBackupCodesGenerated({ newDevice: true, backupCodes: deviceBackupCodes })
    } catch (error) {
      notifyError({ key: 'user2FADevice:validation.error', params: { message: error.message } })
    }
  }, [
    deviceUuid,
    authenticatorCodeOne,
    authenticatorCodeTwo,
    navigate,
    showConfirmBackupCodesGenerated,
    deviceBackupCodes,
    notifyError,
  ])

  const onDeleteClick = useCallback(async () => {
    const confirmed = await confirm({
      key: 'user2FADevice:deletion.confirm',
      params: { deviceName },
      okButtonLabel: 'common.delete',
    })
    if (!confirmed) return
    try {
      await API.removeDevice(deviceUuid)
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
        const nextDevice = { ...prevDevice, [User2FADevice.keys.deviceName]: value }
        User2FADeviceValidator.validateDevice(existingDevices)(nextDevice).then((nextValidation) => {
          const nextDeviceWithValidation = Validation.assocValidation(nextValidation)(nextDevice)
          setDevice(nextDeviceWithValidation)
        })
        return nextDevice
      })
    },
    [existingDevices]
  )

  const onRegenerateBackupCodesClick = useCallback(async () => {
    try {
      const confirmed = await confirm({
        key: 'user2FADevice:regenerateBackupCodes.confirm',
        params: { deviceName },
        okButtonLabel: 'user2FADevice:regenerateBackupCodes.label',
      })
      if (!confirmed) return
      const newBackupCodes = await API.regenerateBackupCodes({ deviceUuid })

      navigate(-1)

      await showConfirmBackupCodesGenerated({ newDevice: false, backupCodes: newBackupCodes })
    } catch (error) {
      notifyError({ key: 'user2FADevice:error.regenerateBackupCodes', params: { message: error.message } })
    }
  }, [confirm, deviceName, deviceUuid, navigate, showConfirmBackupCodesGenerated, notifyError])

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
      <FormItem label="user2FADevice:deviceNameFinal">
        <Input value={deviceNameFinal} readOnly />
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
        {!isNew && !deviceCreated && (
          <Button label="user2FADevice:regenerateBackupCodes.label" onClick={onRegenerateBackupCodesClick} />
        )}
        {(!isNew || deviceCreated) && <ButtonDelete onClick={onDeleteClick} />}
      </div>
    </div>
  )
}
