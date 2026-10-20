declare module 'qrcode' {
  export type QRCodeErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

  export interface QRCodeToBufferOptions {
    type?: 'png'
    errorCorrectionLevel?: QRCodeErrorCorrectionLevel
    margin?: number
    width?: number
  }

  export function toBuffer(text: string, options?: QRCodeToBufferOptions): Promise<Buffer>
}
