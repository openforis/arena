/**
 * Sentinel-2 search over an injected index reader: pruning, missing parts, de-duplication, period and
 * tile filtering, cancellation.
 */
import { SCENE_INDEX_COLUMNS } from '@webapp/components/MapContainer/workspace/scenes/sceneRows'
import { getScenePeriod } from '@webapp/components/MapContainer/workspace/scenes/scenePeriod'
import { isAbortError, searchScenes } from '@webapp/components/MapContainer/workspace/scenes/sceneSearch'
import type {
  RowGroupInfo,
  SceneIndexReader,
  SceneIndexRow,
} from '@webapp/components/MapContainer/workspace/scenes/sceneTypes'

const BASE = 'https://example.test/s2'
const ITEMS = `${BASE}/year=2026/items.parquet`
const LIVE_09 = `${BASE}/year=2026/live-09.parquet`
const LIVE_10 = `${BASE}/year=2026/live-10.parquet`
// 1 month back from 2026-10-11 reads items, live-09 and live-10.
const period = getScenePeriod(1, new Date('2026-10-11T10:30:00Z'))

const group = (index: number, rowStart: number, tileMin: string, tileMax: string): RowGroupInfo => ({
  index,
  rowStart,
  rowEnd: rowStart + 3,
  tileMin,
  tileMax,
})

const row = (id: string, datetime: string, tile: string, cloud = 5): SceneIndexRow => ({
  id,
  datetime: new Date(datetime),
  'eo:cloud_cover': cloud,
  's2:nodata_pixel_percentage': 0,
  thumbnail_url: `https://bucket.s3.us-west-2.amazonaws.com/${id}/L2A_PVI.jpg`,
  _tile: tile,
})

const GROUPS: Record<string, RowGroupInfo[] | null> = {
  [ITEMS]: [group(0, 0, '36MZD', '37MAU'), group(1, 3, '37MBU', '37MBU'), group(2, 6, '37MBV', '38MAA')],
  [LIVE_09]: null, // 404: already folded into items.parquet
  [LIVE_10]: [group(0, 0, '37MBU', '37MBV')],
}

const ROWS: Record<string, SceneIndexRow[]> = {
  [`${ITEMS}#1`]: [
    row('S2B_37MBU_20261005', '2026-10-05T07:50:00Z', '37MBU', 50),
    row('S2A_37MBU_20260920', '2026-09-20T07:50:00Z', '37MBU'),
    row('S2A_37MBU_20260801', '2026-08-01T07:50:00Z', '37MBU'),
  ],
  [`${LIVE_10}#0`]: [
    row('S2B_37MBU_20261005', '2026-10-05T07:50:00Z', '37MBU', 10),
    row('S2A_37MBV_20261006', '2026-10-06T07:50:00Z', '37MBV'),
    { ...row('S2C_37MBU_BAD', '2026-10-07T07:50:00Z', '37MBU'), datetime: 'not a date' },
  ],
}

type FakeReader = SceneIndexReader & { readRowGroups: jest.Mock; readRows: jest.Mock }

const createFakeReader = (groups: Record<string, RowGroupInfo[] | null> = GROUPS): FakeReader => ({
  readRowGroups: jest.fn(async (url: string) => groups[url] ?? null),
  readRows: jest.fn(async (url: string, rowGroup: RowGroupInfo) => ROWS[`${url}#${rowGroup.index}`] ?? []),
})

describe('Sentinel-2 scene search (281)', () => {
  test('reads only the row groups of the tiles and returns unique scenes, newest first', async () => {
    const reader = createFakeReader()
    const scenes = await searchScenes({ reader, tiles: ['37MBU'], period, baseUrl: BASE })

    expect(scenes.map((scene) => scene.id)).toEqual(['S2B_37MBU_20261005', 'S2A_37MBU_20260920'])
    // the live tail is read after items.parquet, so its copy of a duplicated scene wins
    expect(scenes[0].cloud).toBe(10)
    expect(reader.readRowGroups.mock.calls.map(([url]) => url)).toEqual([ITEMS, LIVE_09, LIVE_10])
    expect(reader.readRows).toHaveBeenCalledTimes(2)
    expect(reader.readRows).toHaveBeenCalledWith(ITEMS, GROUPS[ITEMS]?.[1], SCENE_INDEX_COLUMNS)
    expect(reader.readRows).toHaveBeenCalledWith(LIVE_10, GROUPS[LIVE_10]?.[0], SCENE_INDEX_COLUMNS)
  })

  test('treats a missing part as empty', async () => {
    const reader = createFakeReader({})
    await expect(searchScenes({ reader, tiles: ['37MBU'], period, baseUrl: BASE })).resolves.toEqual([])
    expect(reader.readRowGroups).toHaveBeenCalledTimes(3)
    expect(reader.readRows).not.toHaveBeenCalled()
  })

  test('reads nothing without tiles', async () => {
    const reader = createFakeReader()
    await expect(searchScenes({ reader, tiles: [], period, baseUrl: BASE })).resolves.toEqual([])
    expect(reader.readRowGroups).not.toHaveBeenCalled()
  })

  test('aborts before reading', async () => {
    const reader = createFakeReader()
    const controller = new AbortController()
    controller.abort()
    await expect(
      searchScenes({ reader, tiles: ['37MBU'], period, baseUrl: BASE, signal: controller.signal })
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(reader.readRowGroups).not.toHaveBeenCalled()
  })

  test('aborts between the footer and the rows', async () => {
    const controller = new AbortController()
    const reader = createFakeReader()
    reader.readRowGroups.mockImplementation(async (url: string) => {
      controller.abort()
      return GROUPS[url] ?? null
    })
    const search = searchScenes({ reader, tiles: ['37MBU'], period, baseUrl: BASE, signal: controller.signal })
    await expect(search).rejects.toMatchObject({ name: 'AbortError' })
    expect(reader.readRows).not.toHaveBeenCalled()
  })

  test('lets reader failures reject the search', async () => {
    const reader = createFakeReader()
    reader.readRows.mockRejectedValue(new Error('range request failed'))
    await expect(searchScenes({ reader, tiles: ['37MBU'], period, baseUrl: BASE })).rejects.toThrow(
      'range request failed'
    )
  })

  test('recognises abort errors only', () => {
    expect(isAbortError(new DOMException('cancelled', 'AbortError'))).toBe(true)
    expect(isAbortError(new Error('boom'))).toBe(false)
    expect(isAbortError(null)).toBe(false)
  })
})
