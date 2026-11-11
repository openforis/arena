/**
 * Scene filters (max cloud, min coverage, month) and sorts (newest, least cloud, most coverage).
 */
import {
  DEFAULT_SCENE_FILTERS,
  filterScenes,
  filterScenesByMonth,
  passesSceneFilters,
  SCENE_SORTS,
  sortScenes,
} from '@webapp/components/MapContainer/workspace/scenes/sceneFilters'
import type { SceneResult, SceneSort } from '@webapp/components/MapContainer/workspace/scenes/sceneTypes'

const scene = (id: string, datetime: string, cloud: number | null, coverage: number | null): SceneResult => ({
  id,
  datetime,
  date: datetime.slice(0, 10),
  tile: '37MBU',
  cloud,
  coverage,
  thumbnailUrl: null,
})

const ids = (scenes: SceneResult[]): string[] => scenes.map((item) => item.id)

describe('Sentinel-2 scene filters and sorts (277)', () => {
  test('defaults to 20 % cloud and 80 % coverage', () => {
    expect(DEFAULT_SCENE_FILTERS).toEqual({ maxCloud: 20, minCoverage: 80 })
  })

  test('keeps scenes within both limits, limits included', () => {
    expect(passesSceneFilters(scene('a', '2026-10-01T00:00:00Z', 20, 80), DEFAULT_SCENE_FILTERS)).toBe(true)
    expect(passesSceneFilters(scene('b', '2026-10-01T00:00:00Z', 20.5, 100), DEFAULT_SCENE_FILTERS)).toBe(false)
    expect(passesSceneFilters(scene('c', '2026-10-01T00:00:00Z', 0, 79.9), DEFAULT_SCENE_FILTERS)).toBe(false)
  })

  test('lets unknown values pass only at the widest setting', () => {
    const unknownCloud = scene('a', '2026-10-01T00:00:00Z', null, 100)
    const unknownCoverage = scene('b', '2026-10-01T00:00:00Z', 0, null)
    expect(passesSceneFilters(unknownCloud, DEFAULT_SCENE_FILTERS)).toBe(false)
    expect(passesSceneFilters(unknownCloud, { maxCloud: 100, minCoverage: 80 })).toBe(true)
    expect(passesSceneFilters(unknownCoverage, DEFAULT_SCENE_FILTERS)).toBe(false)
    expect(passesSceneFilters(unknownCoverage, { maxCloud: 20, minCoverage: 0 })).toBe(true)
  })

  test('filters a list and a month', () => {
    const scenes = [
      scene('sep', '2026-09-30T23:00:00.000Z', 5, 100),
      scene('oct', '2026-10-01T01:00:00.000Z', 5, 100),
      scene('cloudy', '2026-10-02T01:00:00.000Z', 90, 100),
    ]
    expect(ids(filterScenes(scenes, DEFAULT_SCENE_FILTERS))).toEqual(['sep', 'oct'])
    expect(ids(filterScenesByMonth(scenes, '2026-10'))).toEqual(['oct', 'cloudy'])
    expect(filterScenesByMonth(scenes, null)).toBe(scenes)
  })

  test('sorts newest first, ties by id', () => {
    const scenes = [
      scene('b', '2026-10-01T08:00:00.000Z', 5, 100),
      scene('old', '2026-09-01T08:00:00.000Z', 5, 100),
      scene('a', '2026-10-01T08:00:00.000Z', 5, 100),
    ]
    expect(ids(sortScenes(scenes, 'newest'))).toEqual(['a', 'b', 'old'])
    expect(ids(scenes)).toEqual(['b', 'old', 'a'])
  })

  test('sorts by least cloud and by most coverage with unknown values last', () => {
    const scenes = [
      scene('unknown', '2026-10-05T08:00:00.000Z', null, null),
      scene('cloudyOld', '2026-09-01T08:00:00.000Z', 30, 70),
      scene('clearOld', '2026-09-02T08:00:00.000Z', 1, 99),
      scene('clearNew', '2026-10-02T08:00:00.000Z', 1, 99),
    ]
    expect(ids(sortScenes(scenes, 'leastCloud'))).toEqual(['clearNew', 'clearOld', 'cloudyOld', 'unknown'])
    expect(ids(sortScenes(scenes, 'mostCoverage'))).toEqual(['clearNew', 'clearOld', 'cloudyOld', 'unknown'])
  })

  test('offers three sorts and falls back to newest', () => {
    expect(SCENE_SORTS).toEqual(['newest', 'leastCloud', 'mostCoverage'])
    const scenes = [scene('old', '2026-09-01T08:00:00.000Z', 5, 100), scene('new', '2026-10-01T08:00:00.000Z', 5, 100)]
    expect(ids(sortScenes(scenes, 'unknown' as SceneSort))).toEqual(['new', 'old'])
  })
})
