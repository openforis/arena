import './QRCodeLoginDialog.scss'

import React, { useCallback, useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import PropTypes from 'prop-types'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

import { Button, Markdown, Modal, ModalBody, Spinner } from '@webapp/components'
import { useOnWebSocketEvent } from '@webapp/components/hooks'
import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'

const fetchTempAuthTokenInternal = async () => {
  let stateNext = {}
  try {
    const tempAuthToken = await API.createTempAuthToken()
    const serverUrl = window.location.origin
    const qrData = JSON.stringify({
      serverUrl,
      token: tempAuthToken.token,
    })
    Object.assign(stateNext, { qrValue: qrData, token: tempAuthToken.token })
  } catch (error) {
    Object.assign(stateNext, { error: error.message })
  } finally {
    Object.assign(stateNext, { loading: false })
  }
  return stateNext
}

export const QRCodeLoginDialog = (props) => {
  const { onClose } = props

  const i18n = useI18n()
  const [state, setState] = useState({
    error: null,
    loginSuccessful: false,
    loading: true,
    qrValue: '',
    token: null,
  })
  const { error, loginSuccessful, loading, qrValue, token } = state

  const fetchTempAuthToken = useCallback(async () => {
    setState((state) => ({ ...state, loading: true }))
    setTimeout(() => {
      fetchTempAuthTokenInternal().then((stateNext) => {
        setState((state) => ({ ...state, ...stateNext }))
      })
    }, 1000) // Allow loading spinner to render
  }, [])

  useEffect(() => {
    fetchTempAuthToken()
  }, [fetchTempAuthToken])

  const onRefreshClick = useCallback(() => {
    setState((state) => ({ ...state, error: null, loading: true, qrValue: '', token: null }))

    fetchTempAuthToken()
  }, [fetchTempAuthToken])

  const onLoginSuccessful = useCallback(
    (event) => {
      const { token: eventToken } = event
      if (eventToken === token) {
        setState((state) => ({ ...state, qrValue: null, loginSuccessful: true }))
      }
    },
    [token]
  )

  useOnWebSocketEvent({
    eventName: WebSocketEvents.tempLoginSuccessful,
    eventHandler: onLoginSuccessful,
  })

  return (
    <Modal className="qr-code-login-dialog" onClose={onClose} showCloseButton title="header.qrCodeLoginDialog.title">
      <ModalBody>
        {loginSuccessful && <div>{i18n.t('header.qrCodeLoginDialog.success')}</div>}
        {loading && <Spinner />}
        {!loading && qrValue && (
          <div className="qr-code-container">
            <QRCodeCanvas value={qrValue} />
            <Markdown className="qr-code-instructions" source={i18n.t('header.qrCodeLoginDialog.instructions')} />
          </div>
        )}
        {error && (
          <>
            <div className="error-message">{i18n.t('header.qrCodeLoginDialog.error', { error })}</div>
            <Button label="common.refresh" onClick={onRefreshClick} />
          </>
        )}
      </ModalBody>
    </Modal>
  )
}

QRCodeLoginDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
}
