import React, { useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import PropTypes from 'prop-types'

import { Modal, ModalBody } from '@webapp/components'
import * as API from '@webapp/service/api'

export const QRCodeLoginDialog = (props) => {
  const { onClose } = props

  const [qrValue, setQrValue] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTempAuthToken = async () => {
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
        console.error('Error creating temp auth token:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTempAuthToken()
  }, [])

  return (
    <Modal className="qr-code-login-dialog" onClose={onClose} showCloseButton title="header.qrCodeLoginDialog.title">
      <ModalBody>{loading ? <div>Loading...</div> : <QRCodeCanvas value={qrValue} size={256} />}</ModalBody>
    </Modal>
  )
}

QRCodeLoginDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
}
