import {
  canFinishMeasure,
  getMeasureSummary,
  initialMeasureState,
  measureReducer,
} from '@webapp/components/MapContainer/workspace/tools/measure/measureState'
import type {
  LatLngPair,
  MeasureAction,
  MeasureState,
} from '@webapp/components/MapContainer/workspace/tools/measure/measureTypes'

/**
 * Builds the action Geoman's pm:change produces.
 * @param {LatLngPair[]} vertices - The vertices of the working layer.
 * @param {LatLngPair[]} latLngs - The event lat/lngs (vertices plus the cursor when it moved).
 * @returns {MeasureAction} The change action.
 */
const change = (vertices: LatLngPair[], latLngs: LatLngPair[] = vertices): MeasureAction => ({
  type: 'change',
  vertices,
  latLngs,
})

const LINE: LatLngPair[] = [
  [0, 0],
  [0, 1],
]

describe('Map measure state (262)', () => {
  test('starts idle', () => {
    expect(initialMeasureState).toEqual({ phase: 'idle', vertices: [], cursor: null })
  })

  test('a vertex click starts drawing without a rubber band', () => {
    expect(measureReducer(initialMeasureState, change([[0, 0]]))).toEqual({
      phase: 'drawing',
      vertices: [[0, 0]],
      cursor: null,
    })
  })

  test('the extra position after the vertices is the rubber-band end', () => {
    expect(measureReducer(initialMeasureState, change([[0, 0]], LINE))).toEqual({
      phase: 'drawing',
      vertices: [[0, 0]],
      cursor: [0, 1],
    })
  })

  test('cursor moves before the first vertex keep the idle state', () => {
    expect(measureReducer(initialMeasureState, change([], [[0, 1]]))).toBe(initialMeasureState)
  })

  test('finish keeps the vertices and drops the cursor', () => {
    const drawing = measureReducer(initialMeasureState, change([[0, 0]], LINE))
    expect(measureReducer(drawing, { type: 'finish', vertices: LINE })).toEqual({
      phase: 'finished',
      vertices: LINE,
      cursor: null,
    })
  })

  test('cursor moves after finishing keep the finished measurement', () => {
    const finished: MeasureState = { phase: 'finished', vertices: LINE, cursor: null }
    expect(measureReducer(finished, change([], [[5, 5]]))).toBe(finished)
  })

  test('the first vertex of the next measurement replaces the finished one', () => {
    const finished: MeasureState = { phase: 'finished', vertices: LINE, cursor: null }
    expect(measureReducer(finished, change([[3, 3]]))).toEqual({ phase: 'drawing', vertices: [[3, 3]], cursor: null })
  })

  test('reset returns the initial state', () => {
    const finished: MeasureState = { phase: 'finished', vertices: LINE, cursor: null }
    expect(measureReducer(finished, { type: 'reset' })).toBe(initialMeasureState)
  })

  test('reset on the idle state returns the same object', () => {
    expect(measureReducer(initialMeasureState, { type: 'reset' })).toBe(initialMeasureState)
  })

  test('distance needs two vertices to finish', () => {
    expect(canFinishMeasure('distance', 1)).toBe(false)
    expect(canFinishMeasure('distance', 2)).toBe(true)
  })

  test('area needs three vertices to finish', () => {
    expect(canFinishMeasure('area', 2)).toBe(false)
    expect(canFinishMeasure('area', 3)).toBe(true)
  })

  test('distance includes the rubber-band segment while drawing', () => {
    const state: MeasureState = { phase: 'drawing', vertices: [[0, 0]], cursor: [0, 1] }
    const summary = getMeasureSummary('distance', state)
    expect(summary.length).toBeCloseTo(111195.08, 1)
    expect(summary.area).toBeNull()
  })

  test('distance with one vertex and no cursor has no length', () => {
    const state: MeasureState = { phase: 'drawing', vertices: [[0, 0]], cursor: null }
    expect(getMeasureSummary('distance', state)).toEqual({ length: null, area: null })
  })

  test('area includes the cursor as a vertex while drawing', () => {
    const state: MeasureState = {
      phase: 'drawing',
      vertices: [
        [0, 0],
        [0, 0.01],
      ],
      cursor: [0.01, 0],
    }
    const summary = getMeasureSummary('area', state)
    expect(summary.area).toBeCloseTo(618217.29, 1)
    expect(summary.length).toBeCloseTo(3796.44, 1)
  })

  test('nothing is measured when idle', () => {
    expect(getMeasureSummary('distance', initialMeasureState)).toEqual({ length: null, area: null })
    expect(getMeasureSummary('area', initialMeasureState)).toEqual({ length: null, area: null })
  })
})
