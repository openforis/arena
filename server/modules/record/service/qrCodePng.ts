import { toBuffer as qrToBuffer } from 'qrcode'

/**
 * Renders a URL as a PNG buffer for PDF or DOCX embedding.
 * @param {string} url - Absolute public URL encoded in the QR code.
 * @returns {Promise<Buffer>} PNG bytes.
 */
export const toQrPngBuffer = async (url: string): Promise<Buffer> =>
  qrToBuffer(url, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 256,
  })
