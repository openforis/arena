export type ScreenshotCaptureMode = 'view' | 'plot'

export type ScreenshotTarget = 'record' | 'file'

export type ScreenshotFormat = { type: string; extension: string; quality?: number }

// records get a JPEG: lighter for Arena Mobile and the attribute size limits; "Download only" keeps a lossless PNG
export const SCREENSHOT_FORMATS: Record<ScreenshotTarget, ScreenshotFormat> = {
  record: { type: 'image/jpeg', extension: '.jpg', quality: 0.85 },
  file: { type: 'image/png', extension: '.png' },
}

export type ScreenshotOptions = {
  capture: ScreenshotCaptureMode
  includeData: boolean
  includeScale: boolean
  includeStamp: boolean
}

export type LatLngLiteral = { lat: number; lng: number }

export type ScreenshotPlotCandidate = {
  key: string // `${recordUuid}-${parentUuid}`: one entry per plot
  recordUuid: string
  parentUuid: string // node uuid of the entity holding the location attribute
  entityDefUuid: string // the plot entity: nearest multiple entity ancestor of the location attribute (or the root)
  entityName: string
  keys: string[]
  label: string
  lat: number
  lng: number
}

export type ScreenshotImageAttributeOption = {
  uuid: string
  parentUuid: string // node def uuid of the entity holding the attribute
  label: string
  multiple: boolean
  maxFileSizeMb: number
  rowParentDefUuid: string | null // set when the parent is a multiple entity: the image goes in a new row under it
}

export type ScreenshotNotice = {
  key: string
  params?: Record<string, string | number>
  blocking: boolean // true: no image can be produced
}

export type ScreenshotSaveOutcome =
  | { status: 'saved' }
  | { status: 'pending' }
  | { status: 'cancelled' }
  | { status: 'error'; key: string; params?: Record<string, string | number> }

// Plain text rendered by React: do not HTML-escape the interpolated values (plot keys, labels, file names, details).
export const PLAIN_TEXT = { interpolation: { escapeValue: false } } as const
