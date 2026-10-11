/**
 * Sentinel-2 index parts: which files a period reads, row-group statistics of `_tile` and pruning.
 */
import { readPartLength } from '@webapp/components/MapContainer/workspace/scenes/sceneIndexFetch'
import {
  getIndexPartUrls,
  getRowGroupInfos,
  SCENE_INDEX_BASE_URL,
  SCENE_INDEX_TILE_COLUMN,
  selectRowGroups,
} from '@webapp/components/MapContainer/workspace/scenes/sceneIndexParts'
import {
  createSceneIndexCache,
  MAX_CACHED_ROW_GROUPS,
} from '@webapp/components/MapContainer/workspace/scenes/sceneIndexCache'
import { getScenePeriod } from '@webapp/components/MapContainer/workspace/scenes/scenePeriod'
import type { RowGroupInfo } from '@webapp/components/MapContainer/workspace/scenes/sceneTypes'

const BASE = 'https://example.test/s2'

const group = (index: number, tileMin: string | null, tileMax: string | null): RowGroupInfo => ({
  index,
  rowStart: index * 10,
  rowEnd: index * 10 + 10,
  tileMin,
  tileMax,
})

describe('Sentinel-2 index parts (279)', () => {
  test('reads the year file and one live tail per month of the period', () => {
    expect(SCENE_INDEX_BASE_URL).toBe('https://data.source.coop/tge-labs/s2-stac-geoparquet/sentinel-2-c1-l2a')
    expect(getIndexPartUrls(getScenePeriod(6, new Date('2026-10-11T10:30:00Z')), BASE)).toEqual([
      `${BASE}/year=2026/items.parquet`,
      `${BASE}/year=2026/live-04.parquet`,
      `${BASE}/year=2026/live-05.parquet`,
      `${BASE}/year=2026/live-06.parquet`,
      `${BASE}/year=2026/live-07.parquet`,
      `${BASE}/year=2026/live-08.parquet`,
      `${BASE}/year=2026/live-09.parquet`,
      `${BASE}/year=2026/live-10.parquet`,
    ])
  })

  test('crosses the year boundary', () => {
    const urls = getIndexPartUrls(getScenePeriod(6, new Date('2027-02-15T09:00:00Z')), BASE)
    expect(urls).toEqual([
      `${BASE}/year=2026/items.parquet`,
      `${BASE}/year=2026/live-08.parquet`,
      `${BASE}/year=2026/live-09.parquet`,
      `${BASE}/year=2026/live-10.parquet`,
      `${BASE}/year=2026/live-11.parquet`,
      `${BASE}/year=2026/live-12.parquet`,
      `${BASE}/year=2027/items.parquet`,
      `${BASE}/year=2027/live-01.parquet`,
      `${BASE}/year=2027/live-02.parquet`,
    ])
    expect(urls.some((url) => url.endsWith('/live.parquet'))).toBe(false)
  })

  test('uses the public index by default', () => {
    expect(getIndexPartUrls(getScenePeriod(1, new Date('2026-10-11T10:30:00Z')))[0]).toBe(
      `${SCENE_INDEX_BASE_URL}/year=2026/items.parquet`
    )
  })

  test('reads the tile statistics of every row group', () => {
    const tileChunk = (statistics?: object) => ({
      meta_data: { path_in_schema: [SCENE_INDEX_TILE_COLUMN], statistics },
    })
    const idChunk = { meta_data: { path_in_schema: ['id'], statistics: { min_value: 'S2A', max_value: 'S2C' } } }
    const metadata = {
      row_groups: [
        { num_rows: BigInt(6144), columns: [idChunk, tileChunk({ min_value: '01CCV', max_value: '05KNA' })] },
        {
          num_rows: BigInt(6144),
          columns: [
            idChunk,
            tileChunk({ min_value: new TextEncoder().encode('37MBT'), max_value: new TextEncoder().encode('37MBV') }),
          ],
        },
        { num_rows: 100, columns: [idChunk, tileChunk()] },
      ],
    }
    expect(getRowGroupInfos(metadata, SCENE_INDEX_TILE_COLUMN)).toEqual([
      { index: 0, rowStart: 0, rowEnd: 6144, tileMin: '01CCV', tileMax: '05KNA' },
      { index: 1, rowStart: 6144, rowEnd: 12288, tileMin: '37MBT', tileMax: '37MBV' },
      { index: 2, rowStart: 12288, rowEnd: 12388, tileMin: null, tileMax: null },
    ])
  })

  test('keeps the row groups that may hold a tile, and groups without statistics', () => {
    const groups = [
      group(0, '01CCV', '05KNA'),
      group(1, '37MBT', '37MBV'),
      group(2, null, null),
      group(3, '60KZG', '60XWA'),
    ]
    expect(selectRowGroups(groups, ['37MBU']).map((item) => item.index)).toEqual([1, 2])
    expect(selectRowGroups(groups, ['37MBT']).map((item) => item.index)).toEqual([1, 2])
    expect(selectRowGroups(groups, ['01KAB', '60KZG']).map((item) => item.index)).toEqual([0, 2, 3])
    expect(selectRowGroups(groups, [])).toEqual([])
  })

  describe('part size (HEAD)', () => {
    const head = (status: number, contentLength?: string): typeof fetch =>
      jest.fn(async () => ({
        status,
        ok: status >= 200 && status < 300,
        headers: new Headers(contentLength === undefined ? {} : { 'content-length': contentLength }),
      })) as unknown as typeof fetch
    const read = (fetchImpl: typeof fetch) => readPartLength({ url: `${BASE}/p.parquet`, fetchImpl })

    test('treats 404 and 403 as a missing part, other failures as errors', async () => {
      await expect(read(head(404))).resolves.toBeNull()
      await expect(read(head(403))).resolves.toBeNull()
      await expect(read(head(500))).rejects.toThrow('status 500')
      await expect(read(head(200))).rejects.toThrow('no content length')
      await expect(read(head(200, '0'))).rejects.toThrow('no content length')
      const fetchImpl = head(200, '1234')
      await expect(read(fetchImpl)).resolves.toBe(1234)
      expect(fetchImpl).toHaveBeenCalledWith(
        `${BASE}/p.parquet`,
        expect.objectContaining({ method: 'HEAD', cache: 'no-store' })
      )
    })
  })
})

describe('Sentinel-2 index cache (279)', () => {
  const URL_A = `${BASE}/a.parquet`
  type Part = { groups: RowGroupInfo[] }
  const partOf = (groupCount = 1): Part => ({
    groups: Array.from({ length: groupCount }, (_, i) => group(i, null, null)),
  })

  const setup = (overrides: { openPart?: (url: string) => Promise<Part | null>; part?: Part } = {}) => {
    const part = overrides.part ?? partOf(20)
    const openPart = jest.fn(overrides.openPart ?? (async () => part))
    const loadRows = jest.fn(async () => [{ id: 'x' }])
    return { part, openPart, loadRows, reader: createSceneIndexCache<Part>({ openPart, loadRows }) }
  }

  test('caches an opened part and its decoded rows', async () => {
    const { reader, openPart, loadRows, part } = setup()
    await reader.readRows(URL_A, part.groups[0], ['id'])
    await reader.readRows(URL_A, part.groups[0], ['id'])
    await reader.readRowGroups(URL_A)
    expect(openPart).toHaveBeenCalledTimes(1)
    expect(loadRows).toHaveBeenCalledTimes(1)
  })

  test('caches a missing part (null)', async () => {
    const { reader, openPart } = setup({ openPart: async () => null })
    expect(await reader.readRowGroups(URL_A)).toBeNull()
    expect(await reader.readRowGroups(URL_A)).toBeNull()
    expect(await reader.readRows(URL_A, group(0, 'a', 'b'), ['id'])).toEqual([])
    expect(openPart).toHaveBeenCalledTimes(1)
  })

  test('evicts a failed open so a retry opens the part again', async () => {
    let calls = 0
    const { reader, openPart } = setup({
      openPart: async () => {
        calls += 1
        if (calls === 1) throw new Error('boom')
        return partOf()
      },
    })
    await expect(reader.readRowGroups(URL_A)).rejects.toThrow('boom')
    await Promise.resolve()
    expect(await reader.readRowGroups(URL_A)).toHaveLength(1)
    expect(openPart).toHaveBeenCalledTimes(2)
  })

  test('evicts the part and every url# row group when a read fails', async () => {
    const part = partOf(2)
    let fail = true
    const openPart = jest.fn(async () => part)
    const loadRows = jest.fn(async (_p: Part, g: RowGroupInfo) => {
      if (g.index === 1 && fail) throw new Error('read failed')
      return [{ id: String(g.index) }]
    })
    const reader = createSceneIndexCache<Part>({ openPart, loadRows })
    await reader.readRows(URL_A, part.groups[0], ['id'])
    await expect(reader.readRows(URL_A, part.groups[1], ['id'])).rejects.toThrow('read failed')
    await Promise.resolve()
    fail = false
    await reader.readRows(URL_A, part.groups[0], ['id'])
    await reader.readRows(URL_A, part.groups[1], ['id'])
    expect(openPart).toHaveBeenCalledTimes(2)
    expect(loadRows).toHaveBeenCalledTimes(4)
  })

  test('keeps at most 16 decoded row groups, dropping the oldest', async () => {
    expect(MAX_CACHED_ROW_GROUPS).toBe(16)
    const { reader, loadRows, part } = setup()
    for (const g of part.groups.slice(0, 17)) await reader.readRows(URL_A, g, ['id'])
    expect(loadRows).toHaveBeenCalledTimes(17)
    await reader.readRows(URL_A, part.groups[16], ['id'])
    expect(loadRows).toHaveBeenCalledTimes(17)
    await reader.readRows(URL_A, part.groups[0], ['id'])
    expect(loadRows).toHaveBeenCalledTimes(18)
  })

  test('throws and evicts when the row range no longer matches the footer', async () => {
    let version = 0
    const openPart = jest.fn(async (): Promise<Part> => {
      version += 1
      return { groups: [{ index: 0, rowStart: 0, rowEnd: version === 1 ? 10 : 20, tileMin: null, tileMax: null }] }
    })
    const loadRows = jest.fn(async () => [])
    const reader = createSceneIndexCache<Part>({ openPart, loadRows })
    const stale = (await reader.readRowGroups(URL_A))![0]
    // Another failure evicted the part; the next open describes different rows.
    await expect(reader.readRows(`${URL_A}`, { ...stale, rowEnd: 99 }, ['id'])).rejects.toThrow('changed')
    await Promise.resolve()
    expect(loadRows).not.toHaveBeenCalled()
    expect((await reader.readRowGroups(URL_A))![0].rowEnd).toBe(20)
    expect(openPart).toHaveBeenCalledTimes(2)
  })
})
