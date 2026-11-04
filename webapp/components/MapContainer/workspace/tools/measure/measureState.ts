import {
  MIN_LINE_VERTICES,
  MIN_POLYGON_VERTICES,
  measureArea,
  measureLength,
  measurePerimeter,
} from '@webapp/components/MapContainer/workspace/tools/measure/measureGeometry'
import type {
  LatLngPair,
  MeasureAction,
  MeasureMode,
  MeasureState,
  MeasureSummary,
} from '@webapp/components/MapContainer/workspace/tools/measure/measureTypes'

export const initialMeasureState: MeasureState = { phase: 'idle', vertices: [], cursor: null }

/**
 * Applies a Geoman change (vertex added or cursor moved) to the state.
 * @param {MeasureState} state - The current state.
 * @param {LatLngPair[]} vertices - The vertices of the shape being drawn.
 * @param {LatLngPair[]} latLngs - The lat/lngs of the event: the vertices, plus the cursor when it moved.
 * @returns {MeasureState} The next state.
 */
const applyChange = (state: MeasureState, vertices: LatLngPair[], latLngs: LatLngPair[]): MeasureState => {
  // before the first click of a new measurement only the cursor moves: keep what is shown
  if (vertices.length === 0) return state
  const cursor = latLngs.length > vertices.length ? (latLngs.at(-1) ?? null) : null
  return { phase: 'drawing', vertices, cursor }
}

/**
 * Reduces the measure state.
 * @param {MeasureState} state - The current state.
 * @param {MeasureAction} action - The action.
 * @returns {MeasureState} The next state.
 */
export const measureReducer = (state: MeasureState, action: MeasureAction): MeasureState => {
  switch (action.type) {
    case 'change':
      return applyChange(state, action.vertices, action.latLngs)
    case 'finish':
      return { phase: 'finished', vertices: action.vertices, cursor: null }
    case 'reset':
      return state.phase === 'idle' ? state : initialMeasureState
    default:
      return state
  }
}

/**
 * Tells whether the shape being drawn has enough vertices to be finished.
 * @param {MeasureMode} mode - Distance (line) or area (polygon).
 * @param {number} vertexCount - The number of vertices placed.
 * @returns {boolean} True with at least 2 vertices for a distance, 3 for an area.
 */
export const canFinishMeasure = (mode: MeasureMode, vertexCount: number): boolean =>
  vertexCount >= (mode === 'area' ? MIN_POLYGON_VERTICES : MIN_LINE_VERTICES)

/**
 * Computes what the bar shows: the length (or perimeter) and the area, including the rubber band while drawing.
 * @param {MeasureMode} mode - Distance or area.
 * @param {MeasureState} state - The measure state.
 * @returns {MeasureSummary} Length in meters and area in square meters, null when not measurable.
 */
export const getMeasureSummary = (mode: MeasureMode, state: MeasureState): MeasureSummary => {
  const { phase, vertices, cursor } = state
  const points = phase === 'drawing' && cursor ? [...vertices, cursor] : vertices
  if (mode === 'distance') {
    return { length: points.length >= MIN_LINE_VERTICES ? measureLength(points) : null, area: null }
  }
  return { length: measurePerimeter(points), area: measureArea(points) }
}
