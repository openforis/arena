import { buildRecordCandidates, selectRecordCandidate } from '@webapp/views/App/views/Data/MapView/mapRecordCandidates'

const point = (key: string, ancestorsKeys: string[], lng: number, lat: number) => ({
  geometry: { coordinates: [lng, lat] as [number, number] },
  properties: { key, ancestorsKeys, parentUuid: 'p', recordUuid: `r-${key}`, recordOwnerUuid: 'o' },
})

const createLayers = () => [
  { key: 'layerA', layerName: 'A', points: [point('k1', ['1', '2'], 12.5, 41.9)], flyToPoint: jest.fn() },
  {
    key: 'layerB',
    layerName: 'B',
    points: [point('k1', ['1', '2'], 13.5, 42.9), point('k2', ['3'], 14.5, 43.9)],
    flyToPoint: jest.fn(),
  },
]

describe('Map record candidates (257)', () => {
  test('one candidate per point and layer, labelled with the ancestor keys', () => {
    expect(buildRecordCandidates(createLayers())).toEqual([
      { id: 'layerA|k1', label: '1 - 2', lat: 41.9, lng: 12.5 },
      { id: 'layerB|k1', label: '1 - 2', lat: 42.9, lng: 13.5 },
      { id: 'layerB|k2', label: '3', lat: 43.9, lng: 14.5 },
    ])
    expect(buildRecordCandidates([])).toEqual([])
  })

  test('selecting a candidate selects the point and flies to it in its own layer', () => {
    const layers = createLayers()
    const selectPoint = jest.fn()
    selectRecordCandidate({ id: 'layerB|k1', activeLayers: layers, selectPoint })
    expect(selectPoint).toHaveBeenCalledWith('k1')
    expect(layers[1].flyToPoint).toHaveBeenCalledWith(layers[1].points[0])
    expect(layers[0].flyToPoint).not.toHaveBeenCalled()
    // flying closes the open popup (deselecting its point): the selection must come after
    expect(selectPoint.mock.invocationCallOrder[0]).toBeGreaterThan(layers[1].flyToPoint.mock.invocationCallOrder[0])
  })

  test('an unknown candidate does nothing', () => {
    const layers = createLayers()
    const selectPoint = jest.fn()
    selectRecordCandidate({ id: 'layerC|k1', activeLayers: layers, selectPoint })
    selectRecordCandidate({ id: 'layerA|zz', activeLayers: layers, selectPoint })
    selectRecordCandidate({ id: 'no-separator', activeLayers: layers, selectPoint })
    expect(selectPoint).not.toHaveBeenCalled()
  })
})
