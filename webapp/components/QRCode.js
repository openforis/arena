import React from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import PropTypes from 'prop-types'

export const QRCode = (props) => {
  const { value, size = 200 } = props
  return <QRCodeCanvas value={value} size={size} />
}

QRCode.propTypes = {
  value: PropTypes.string.isRequired,
  size: PropTypes.number,
}
