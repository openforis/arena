import './QRCodeLoginDialog.scss'

import React, { useCallback, useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import PropTypes from 'prop-types'

import { waitFor } from '@core/promiseUtils'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

import { Button, Markdown, Modal, ModalBody, Spinner } from '@webapp/components'
import { useOnWebSocketEvent } from '@webapp/components/hooks'
import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'

const tempAuthTokenExpirationMs = 60 * 1000 // 60 seconds

const initialState = {
  error: null,
  loginSuccessful: false,
  loading: true,
  qrValue: '',
  token: null,
}

export const QRCodeLoginDialog = (props) => {
  const { onClose } = props

  const i18n = useI18n()
  const authTokenFetchIntervalRef = React.useRef(null) // to store interval ID

  const [state, setState] = useState(initialState)
  const { error, loginSuccessful, loading, qrValue, token } = state

  const cancelAuthTokenFetchInterval = useCallback(() => {
    const interval = authTokenFetchIntervalRef.current
    if (interval) {
      clearInterval(interval)
      authTokenFetchIntervalRef.current = null
    }
  }, [])

  const fetchTempAuthTokenInternal = useCallback(async () => {
    setState((state) => ({ ...state, error: null, loading: true, qrValue: '', token: null }))

    const fetchToken = async () => {
      try {
        const tempAuthToken = await API.createTempAuthToken()
        const serverUrl = globalThis.location.origin
        const qrData = JSON.stringify({
          serverUrl,
          token: tempAuthToken.token,
        })
        return { qrValue: qrData, token: tempAuthToken.token }
      } catch (caughtError) {
        const error = caughtError?.message || String(caughtError) || 'Unknown error'
        return { error }
      }
    }

    const stateNext = { ...(await fetchToken()), loading: false }

    // Allow loading state to propagate
    await waitFor(0.5)

    setState((state) => ({ ...state, ...stateNext }))
  }, [])

  const fetchTempAuthToken = useCallback(async () => {
    cancelAuthTokenFetchInterval()

    fetchTempAuthTokenInternal().then(() => {
      authTokenFetchIntervalRef.current = setInterval(() => {
        fetchTempAuthTokenInternal()
      }, tempAuthTokenExpirationMs) // Refresh token every 60 seconds
    })
  }, [cancelAuthTokenFetchInterval, fetchTempAuthTokenInternal])

  useEffect(() => {
    fetchTempAuthToken()

    return () => {
      cancelAuthTokenFetchInterval()
    }
  }, [cancelAuthTokenFetchInterval, fetchTempAuthToken])

  const onRefreshClick = useCallback(() => {
    fetchTempAuthToken()
  }, [fetchTempAuthToken])

  const onLoginSuccessful = useCallback(
    (event) => {
      const { token: eventToken } = event
      if (eventToken === token) {
        cancelAuthTokenFetchInterval()
        setState({ ...initialState, loginSuccessful: true })
      }
    },
    [cancelAuthTokenFetchInterval, token]
  )

  useOnWebSocketEvent({
    eventName: WebSocketEvents.tempLoginSuccessful,
    eventHandler: onLoginSuccessful,
  })

  return (
    <Modal className="qr-code-login-dialog" onClose={onClose} showCloseButton title="header.qrCodeLoginDialog.title">
      <ModalBody>
        {loginSuccessful && <div>{i18n.t('header.qrCodeLoginDialog.success')}</div>}
        {(loading || qrValue) && (
          <div className="inner-container">
            <div className="qr-code-container">
              {loading && <Spinner />}
              {qrValue && <QRCodeCanvas value={qrValue} size={200} />}
            </div>
            <Markdown className="instructions" source={i18n.t('header.qrCodeLoginDialog.instructions')} />
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
