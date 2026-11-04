/**
 * Sentinel-2 overlay ids and attribution, plot search box, base scene replacement, and the panel status
 * with its message.
 */
import {
  boundsAroundPoint,
  getSceneAttribution,
  getSceneOverlayId,
  isBaseSceneOverlayId,
  removeBaseSceneOverlays,
} from '@webapp/components/MapContainer/workspace/scenes/sceneLayerInfo'
import {
  getScenePanelMessage,
  getScenePanelStatus,
  SCENE_AREA_KEYS,
  type ScenePanelStatusInput,
} from '@webapp/components/MapContainer/workspace/scenes/scenePanelStatus'

const READY: ScenePanelStatusInput = {
  areaKey: 'view',
  hasBounds: true,
  drawing: false,
  tilesStatus: 'ok',
  loading: false,
  failed: false,
  resultCount: 3,
}

describe('Sentinel-2 layer info and panel status (283)', () => {
  test('builds overlay ids per scene, band mix and role', () => {
    expect(getSceneOverlayId('S2A_X', 'trueColour', false)).toBe('s2:layer:trueColour:S2A_X')
    expect(getSceneOverlayId('S2A_X', 'swir', true)).toBe('s2:base:swir:S2A_X')
    expect(isBaseSceneOverlayId('s2:base:swir:S2A_X')).toBe(true)
    expect(isBaseSceneOverlayId('s2:layer:swir:S2A_X')).toBe(false)
  })

  test('credits Copernicus with the acquisition year', () => {
    expect(getSceneAttribution('2025-12-31T23:59:59.000Z')).toBe('Contains modified Copernicus Sentinel data 2025')
  })

  test('builds a small search box around a plot', () => {
    const box = boundsAroundPoint(-1.3, 36.8)
    expect(box.west).toBeCloseTo(36.79, 6)
    expect(box.south).toBeCloseTo(-1.31, 6)
    expect(box.east).toBeCloseTo(36.81, 6)
    expect(box.north).toBeCloseTo(-1.29, 6)
    expect(boundsAroundPoint(0, 0, 0.5)).toEqual({ west: -0.5, south: -0.5, east: 0.5, north: 0.5 })
  })

  test('removes only the current base scene', () => {
    const removeOverlay = jest.fn()
    removeBaseSceneOverlays(
      [{ id: 's2:base:trueColour:A' }, { id: 's2:layer:trueColour:B' }, { id: 'wms:roads' }],
      removeOverlay
    )
    expect(removeOverlay.mock.calls).toEqual([['s2:base:trueColour:A']])
  })

  test('explains why there is no area yet', () => {
    expect(SCENE_AREA_KEYS).toEqual(['view', 'plot', 'draw'])
    expect(getScenePanelStatus({ ...READY, hasBounds: false })).toBe('idle')
    expect(getScenePanelStatus({ ...READY, areaKey: 'plot', hasBounds: false })).toBe('noPlot')
    expect(getScenePanelStatus({ ...READY, areaKey: 'draw', hasBounds: false })).toBe('noDrawnArea')
    expect(getScenePanelStatus({ ...READY, areaKey: 'draw', drawing: true })).toBe('drawing')
  })

  test('reports area limits, errors, loading and results in that order', () => {
    expect(getScenePanelStatus({ ...READY, tilesStatus: 'tooLarge', failed: true })).toBe('tooLarge')
    expect(getScenePanelStatus({ ...READY, tilesStatus: 'outside' })).toBe('outside')
    expect(getScenePanelStatus({ ...READY, failed: true, loading: true })).toBe('error')
    expect(getScenePanelStatus({ ...READY, loading: true })).toBe('searching')
    expect(getScenePanelStatus({ ...READY, resultCount: 0 })).toBe('empty')
    expect(getScenePanelStatus(READY)).toBe('results')
  })

  test('maps statuses to messages', () => {
    expect(getScenePanelMessage('tooLarge', 0)).toEqual({
      key: 'mapWorkspace.scenes.messages.tooLarge',
      params: { max: 16 },
    })
    expect(getScenePanelMessage('searching', 3)).toEqual({
      key: 'mapWorkspace.scenes.messages.searching',
      params: { count: 3 },
    })
    expect(getScenePanelMessage('empty', 3)).toEqual({ key: 'mapWorkspace.scenes.messages.empty' })
    expect(getScenePanelMessage('drawing', 0)).toEqual({ key: 'mapWorkspace.scenes.messages.drawing' })
    expect(getScenePanelMessage('results', 3)).toBeNull()
    expect(getScenePanelMessage('idle', 0)).toBeNull()
  })
})
