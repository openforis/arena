import { QRCodeCanvas } from 'qrcode.react'

type QRCodeProps = {
  value: string
  size?: number
}

export const QRCode = (props: QRCodeProps) => {
  const { value, size = 200 } = props
  return <QRCodeCanvas value={value} size={size} />
}
