export type ScreenshotCaptureMode = 'view' | 'plot'

export type ScreenshotTarget = 'record' | 'file'

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
