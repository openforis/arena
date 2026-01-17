import './QRCodeLoginDialog.scss'

import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import QRCode from 'qrcode'
import axios from 'axios'

import { useI18n } from '@webapp/store/system'
import { Modal, ModalBody, ModalFooter } from '@webapp/components/modal'
import { Button } from '@webapp/components'

const TOKEN_EXPIRATION_MINUTES = 5

const QRCodeLoginDialog = (props) => {
  const { onClose } = props

  const i18n = useI18n()

  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeLeft, setTimeLeft] = useState(TOKEN_EXPIRATION_MINUTES * 60)
  const [expired, setExpired] = useState(false)

  const generateQRCode = async () => {
    try {
      setLoading(true)
      setError(null)
      setExpired(false)
      setTimeLeft(TOKEN_EXPIRATION_MINUTES * 60)

      const { data } = await axios.post('/auth/qr-code/generate')
      const { qrCodeUrl } = data

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      setQrData(qrCodeDataUrl)
      setLoading(false)
    } catch (err) {
      setError(err.message || 'Failed to generate QR code')
      setLoading(false)
    }
  }

  useEffect(() => {
    generateQRCode()
  }, [])

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setExpired(true)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleRefresh = () => {
    generateQRCode()
  }

  return (
    <Modal
      className="qr-code-login-dialog"
      onClose={onClose}
      showCloseButton
      title={i18n.t('common:header.qrCodeLogin')}
    >
      <ModalBody>
        <div className="qr-code-login-dialog__content">
          {loading && (
            <div className="qr-code-login-dialog__loading">
              <span className="icon icon-spinner icon-spin icon-2x" />
              <p>{i18n.t('common:loading')}</p>
            </div>
          )}

          {error && (
            <div className="qr-code-login-dialog__error">
              <span className="icon icon-warning icon-2x" />
              <p>{error}</p>
              <Button onClick={handleRefresh} label={i18n.t('common:common.retry')} />
            </div>
          )}

          {!loading && !error && qrData && (
            <>
              <div className="qr-code-login-dialog__description">{i18n.t('common:header.qrCodeLoginDescription')}</div>

              <div className="qr-code-login-dialog__qr-container">
                {expired && (
                  <div className="qr-code-login-dialog__expired-overlay">
                    <span className="icon icon-clock icon-3x" />
                    <p>{i18n.t('common:header.qrCodeExpired')}</p>
                    <Button onClick={handleRefresh} label={i18n.t('common:common.refresh')} />
                  </div>
                )}
                <img src={qrData} alt="QR Code" className="qr-code-login-dialog__qr-image" />
              </div>

              <div className="qr-code-login-dialog__timer">
                {!expired && (
                  <>
                    <span className="icon icon-clock icon-left" />
                    {i18n.t('common:header.qrCodeExpiresIn', { time: formatTime(timeLeft) })}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button onClick={onClose} label={i18n.t('common:common.close')} />
      </ModalFooter>
    </Modal>
  )
}

QRCodeLoginDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
}

export default QRCodeLoginDialog
