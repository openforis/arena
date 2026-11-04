import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as SB from '../../utils/surveyBuilder'

import {
  buildPlotCandidates,
  planarDistance,
  toPlotLayers,
  type PlotLayer,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotPlotCandidates'

const point = ({
  recordUuid,
  parentUuid,
  lat,
  lng,
  keys,
}: {
  recordUuid: string
  parentUuid: string
  lat: number
  lng: number
  keys: unknown[]
}): any => ({
  geometry: { coordinates: [lng, lat] },
  properties: { key: `${recordUuid}-${parentUuid}`, recordUuid, parentUuid, ancestorsKeys: keys },
})

const clusterLayer: PlotLayer = {
  entityDefUuid: 'cluster-def',
  entityName: 'cluster',
  entityLabel: 'Cluster',
  points: [
    point({ recordUuid: 'r1', parentUuid: 'n1', lat: 41.9, lng: 12.5, keys: [1] }),
    point({ recordUuid: 'r2', parentUuid: 'n2', lat: 42.9, lng: 13.5, keys: ['2'] }),
    point({ recordUuid: 'r3', parentUuid: 'n3', lat: Number.NaN, lng: 14.5, keys: ['3'] }),
    { geometry: { coordinates: [1, 1] }, properties: { key: 'x', parentUuid: 'n4' } } as any,
  ],
}

const otherLayer: PlotLayer = {
  entityDefUuid: 'other-def',
  entityName: 'other',
  entityLabel: 'Other',
  points: [
    point({ recordUuid: 'r2', parentUuid: 'n2', lat: 0, lng: 0, keys: ['dup'] }),
    point({ recordUuid: 'r5', parentUuid: 'n5', lat: 41.95, lng: 12.55, keys: [null, ' ', 'A'] }),
    point({ recordUuid: 'r6', parentUuid: 'n6', lat: 10, lng: 10, keys: [] }),
  ],
}

describe('Screenshot plot candidates (292)', () => {
  test('builds one candidate per plot with keys and label, skipping invalid points', () => {
    const candidates = buildPlotCandidates({ layers: [clusterLayer], center: null })
    expect(candidates).toEqual([
      {
        key: 'r1-n1',
        recordUuid: 'r1',
        parentUuid: 'n1',
        entityDefUuid: 'cluster-def',
        entityName: 'cluster',
        keys: ['1'],
        label: 'Cluster 1',
        lat: 41.9,
        lng: 12.5,
      },
      {
        key: 'r2-n2',
        recordUuid: 'r2',
        parentUuid: 'n2',
        entityDefUuid: 'cluster-def',
        entityName: 'cluster',
        keys: ['2'],
        label: 'Cluster 2',
        lat: 42.9,
        lng: 13.5,
      },
    ])
  })

  test('keeps the first layer for a plot listed twice and drops empty keys from the label', () => {
    const candidates = buildPlotCandidates({ layers: [clusterLayer, otherLayer], center: null })
    expect(candidates.map((candidate) => candidate.label)).toEqual(['Cluster 1', 'Cluster 2', 'Other', 'Other A'])
    expect(candidates.find((candidate) => candidate.key === 'r2-n2')?.entityDefUuid).toBe('cluster-def')
  })

  test('sorts the plots by distance from the map centre', () => {
    const candidates = buildPlotCandidates({ layers: [clusterLayer, otherLayer], center: { lat: 42.8, lng: 13.4 } })
    expect(candidates.map((candidate) => candidate.key)).toEqual(['r2-n2', 'r5-n5', 'r1-n1', 'r6-n6'])
  })

  test('returns no candidates without layers', () => {
    expect(buildPlotCandidates({ layers: [], center: { lat: 0, lng: 0 } })).toEqual([])
  })

  test('measures a planar distance corrected by latitude', () => {
    expect(planarDistance({ lat: 10, lng: 10 }, { lat: 10, lng: 10 })).toBe(0)
    expect(planarDistance({ lat: 60, lng: 0 }, { lat: 60, lng: 2 })).toBeCloseTo(1, 5)
  })

  test('keeps the active layers of a location attribute with its multiple entity, dropping the others', async () => {
    const survey = await SB.survey(
      { uuid: 'user' },
      SB.entity(
        'cluster',
        SB.attribute('id', NodeDef.nodeDefType.integer).key(),
        SB.entity('plot', SB.attribute('loc', NodeDef.nodeDefType.coordinate)).multiple()
      )
    ).build()
    const plotDef = Survey.getNodeDefByName('plot')(survey)
    const locDef = Survey.getNodeDefByName('loc')(survey)
    const points = clusterLayer.points
    const layers = toPlotLayers({
      activeLayers: [
        { key: NodeDef.getUuid(locDef), layerName: 'a', points, flyToPoint: jest.fn() },
        { key: 'sampling-point-data-0', layerName: 'b', points, flyToPoint: jest.fn() },
      ],
      survey,
      lang: 'en',
    })
    expect(layers).toEqual([
      { entityDefUuid: NodeDef.getUuid(plotDef), entityName: 'plot', entityLabel: expect.any(String), points },
    ])
  })
})
