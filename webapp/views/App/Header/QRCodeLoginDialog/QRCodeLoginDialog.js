import React, { useCallback, useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import PropTypes from 'prop-types'

import { Button, Modal, ModalBody, Spinner } from '@webapp/components'
import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'

export const QRCodeLoginDialog = (props) => {
  const { onClose } = props

  const i18n = useI18n()
  const [qrValue, setQrValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTempAuthToken = useCallback(async () => {
    try {
      setLoading(true)
      const tempAuthToken = await API.createTempAuthToken()
      const serverUrl = window.location.origin
      const qrData = JSON.stringify({
        serverUrl,
        token: tempAuthToken.token,
      })
      setQrValue(qrData)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTempAuthToken()
  }, [fetchTempAuthToken])

  const onRefreshClick = useCallback(() => {
    setError(null)
    setLoading(true)
    setQrValue('')

    fetchTempAuthToken()
  }, [fetchTempAuthToken])

  return (
    <Modal className="qr-code-login-dialog" onClose={onClose} showCloseButton title="header.qrCodeLoginDialog.title">
      <ModalBody>
        {loading && <Spinner />}
        {!loading && qrValue && <QRCodeCanvas value={qrValue} size={256} />}
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
