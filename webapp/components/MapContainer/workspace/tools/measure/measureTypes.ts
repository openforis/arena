// [latitude, longitude] in degrees: Leaflet's order, converted to GeoJSON [lng, lat] only for turf.
export type LatLngPair = [number, number]

export type LatLngLike = { lat: number; lng: number }

export type MeasureMode = 'distance' | 'area'

export type MeasureDistanceUnit = 'auto' | 'm' | 'km'
export type MeasureAreaUnit = 'auto' | 'm2' | 'ha' | 'km2'
export type MeasureUnitOption = MeasureDistanceUnit | MeasureAreaUnit
export type MeasureUnit = Exclude<MeasureUnitOption, 'auto'>

export type FormattedMeasure = { value: string; unit: MeasureUnit }

// length: path length in Distance mode, perimeter in Area mode (meters); area in square meters; null = not measurable
export type MeasureSummary = { length: number | null; area: number | null }

export type MeasurePhase = 'idle' | 'drawing' | 'finished'

export type MeasureState = {
  phase: MeasurePhase
  vertices: LatLngPair[]
  cursor: LatLngPair | null // rubber-band end while drawing
}

export type MeasureAction =
  | { type: 'change'; vertices: LatLngPair[]; latLngs: LatLngPair[] }
  | { type: 'finish'; vertices: LatLngPair[] }
  | { type: 'reset' }

export type GeomanShape = 'Line' | 'Polygon'

export type MeasurePathStyle = {
  color: string
  weight: number
  dashArray?: string
  fillColor?: string
  fillOpacity?: number
  interactive?: boolean
}

// subset of Geoman's DrawModeOptions used by the measure tool
export type MeasureDrawOptions = {
  snappable: boolean
  tooltips: boolean
  continueDrawing: boolean
  finishOn: null
  allowSelfIntersection: boolean
  templineStyle: MeasurePathStyle
  hintlineStyle: MeasurePathStyle
  pathOptions: MeasurePathStyle
}
