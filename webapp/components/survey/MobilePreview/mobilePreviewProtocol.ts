// messages exchanged with the Arena Mobile web preview (keep in sync with arena-mobile src/preview/previewProtocol.ts)
const prefix = 'arenaMobilePreview/'

export const MobilePreviewMessageType = {
  ready: `${prefix}ready`,
  survey: `${prefix}survey`,
  lang: `${prefix}lang`,
  error: `${prefix}error`,
} as const

type MobilePreviewIncomingMessage =
  { type: typeof MobilePreviewMessageType.ready } | { type: typeof MobilePreviewMessageType.error; message: string }

const isIncomingMessage = (data: unknown): data is MobilePreviewIncomingMessage => {
  const type = (data as { type?: unknown } | null)?.type
  return type === MobilePreviewMessageType.ready || type === MobilePreviewMessageType.error
}

const getPreviewOrigin = (previewUrl: string): string => new URL(previewUrl, window.location.href).origin

const getPreviewSrc = (previewUrl: string): string => {
  const url = new URL(previewUrl, window.location.href)
  url.searchParams.set('preview', '1')
  url.searchParams.set('parentOrigin', window.location.origin)
  return url.toString()
}

export const MobilePreviewProtocol = {
  isIncomingMessage,
  getPreviewOrigin,
  getPreviewSrc,
}
