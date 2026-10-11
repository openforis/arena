/**
 * Index rows to scene results: only the needed columns, unknown values kept as null, bad rows dropped,
 * duplicates (items + live tails) resolved by id.
 */
import {
  dedupeScenes,
  parseCloudCover,
  parseCoverage,
  parseSceneRow,
  SCENE_INDEX_COLUMNS,
} from '@webapp/components/MapContainer/workspace/scenes/sceneRows'
import type { SceneIndexRow, SceneResult } from '@webapp/components/MapContainer/workspace/scenes/sceneTypes'

const THUMBNAIL =
  'https://e84-earth-search-sentinel-data.s3.us-west-2.amazonaws.com/sentinel-2-c1-l2a/37/M/BU/2026/10/S2A_T37MBU_20261007T075621_L2A/L2A_PVI.jpg'

const row = (overrides: SceneIndexRow = {}): SceneIndexRow => ({
  id: 'S2A_T37MBU_20261007T075621_L2A',
  datetime: new Date('2026-10-07T07:56:21.024Z'),
  'eo:cloud_cover': 12.345,
  's2:nodata_pixel_percentage': 3.5,
  thumbnail_url: THUMBNAIL,
  _tile: '37MBU',
  ...overrides,
})

const scene = (id: string, cloud: number): SceneResult => ({
  id,
  datetime: '2026-10-07T07:56:21.024Z',
  date: '2026-10-07',
  tile: '37MBU',
  cloud,
  coverage: 100,
  thumbnailUrl: null,
})

describe('Sentinel-2 index rows (282)', () => {
  test('reads only the needed columns, never assets', () => {
    expect(SCENE_INDEX_COLUMNS).toEqual([
      'id',
      'datetime',
      'eo:cloud_cover',
      's2:nodata_pixel_percentage',
      'thumbnail_url',
      '_tile',
    ])
    expect(SCENE_INDEX_COLUMNS).not.toContain('assets')
  })

  test('parses a complete row', () => {
    expect(parseSceneRow(row())).toEqual({
      id: 'S2A_T37MBU_20261007T075621_L2A',
      datetime: '2026-10-07T07:56:21.024Z',
      date: '2026-10-07',
      tile: '37MBU',
      cloud: 12.345,
      coverage: 96.5,
      thumbnailUrl: THUMBNAIL,
    })
  })

  test('accepts string and number datetimes', () => {
    expect(parseSceneRow(row({ datetime: '2026-10-07T07:56:21Z' }))?.datetime).toBe('2026-10-07T07:56:21.000Z')
    expect(parseSceneRow(row({ datetime: Date.UTC(2026, 9, 7) }))?.date).toBe('2026-10-07')
  })

  test('drops rows without a usable id, tile or datetime', () => {
    expect(parseSceneRow(row({ id: undefined }))).toBeNull()
    expect(parseSceneRow(row({ id: 42 }))).toBeNull()
    expect(parseSceneRow(row({ id: '' }))).toBeNull()
    expect(parseSceneRow(row({ _tile: null }))).toBeNull()
    expect(parseSceneRow(row({ datetime: 'not a date' }))).toBeNull()
    expect(parseSceneRow(row({ datetime: new Date(Number.NaN) }))).toBeNull()
    expect(parseSceneRow(row({ datetime: undefined }))).toBeNull()
  })

  test('keeps unknown cloud and nodata as null', () => {
    for (const value of [Number.NaN, null, undefined, '12', Number.POSITIVE_INFINITY]) {
      expect(parseCloudCover(value)).toBeNull()
      expect(parseCoverage(value)).toBeNull()
    }
    const parsed = parseSceneRow(row({ 'eo:cloud_cover': Number.NaN, 's2:nodata_pixel_percentage': null }))
    expect(parsed?.cloud).toBeNull()
    expect(parsed?.coverage).toBeNull()
  })

  test('clamps percentages to 0–100', () => {
    expect(parseCloudCover(120)).toBe(100)
    expect(parseCloudCover(-5)).toBe(0)
    expect(parseCoverage(120)).toBe(0)
    expect(parseCoverage(-5)).toBe(100)
    expect(parseCoverage(0)).toBe(100)
  })

  test('ignores a missing or non-string thumbnail', () => {
    expect(parseSceneRow(row({ thumbnail_url: '' }))?.thumbnailUrl).toBeNull()
    expect(parseSceneRow(row({ thumbnail_url: 42 }))?.thumbnailUrl).toBeNull()
  })

  test('keeps the last copy of a duplicated id at the position of the first', () => {
    const first = scene('a', 50)
    const other = scene('b', 5)
    const last = scene('a', 10)
    expect(dedupeScenes([first, other, last])).toEqual([last, other])
  })
})
