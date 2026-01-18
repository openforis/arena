import React, { useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import PropTypes from 'prop-types'

import { Modal, ModalBody } from '@webapp/components'

export const QRCodeLoginDialog = (props) => {
  const { onClose } = props

  const [qrValue, setQrValue] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {}, [])

  return (
    <Modal className="qr-code-login-dialog" onClose={onClose} showCloseButton title="header.qrCodeLoginDialog.title">
      <ModalBody>
        <QRCodeCanvas value={qrValue} />
      </ModalBody>
    </Modal>
  )
}

QRCodeLoginDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
}
