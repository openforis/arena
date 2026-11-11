// Longitudes may leave [-180, 180] (Leaflet keeps panning past the antimeridian); mgrsTiles wraps them.
export type GeoBounds = { west: number; south: number; east: number; north: number }

export type ScenePeriodMonths = 1 | 3 | 6

export type ScenePeriod = {
  months: ScenePeriodMonths
  start: Date // 00:00 UTC of the same day `months` months back
  end: Date // the moment the period was computed
}

export type SceneResult = {
  id: string
  datetime: string // ISO 8601, UTC
  date: string // YYYY-MM-DD, UTC
  tile: string // zero-padded MGRS tile, e.g. 37MBU
  cloud: number | null // eo:cloud_cover 0–100, null when unknown
  coverage: number | null // 100 − s2:nodata_pixel_percentage, null when unknown
  thumbnailUrl: string | null
}

export type SceneSort = 'newest' | 'leastCloud' | 'mostCoverage'

export type SceneBandMix = 'trueColour' | 'falseColourVegetation' | 'swir'

export type SceneAreaKey = 'view' | 'plot' | 'draw'

export type SceneFilters = { maxCloud: number; minCoverage: number }

export type RowGroupInfo = {
  index: number
  rowStart: number // inclusive
  rowEnd: number // exclusive
  tileMin: string | null // null when the file has no statistics for the tile column
  tileMax: string | null
}

export type SceneIndexRow = Record<string, unknown>

// No AbortSignal here on purpose: readers cache promises, and a cancelled read must not poison the cache.
export type SceneIndexReader = {
  readRowGroups: (url: string) => Promise<RowGroupInfo[] | null> // null = the part does not exist
  readRows: (url: string, group: RowGroupInfo, columns: string[]) => Promise<SceneIndexRow[]>
}

export type MonthBucket = { key: string; year: number; month: number; count: number }

export type MgrsTilesResult = { status: 'ok'; tiles: string[] } | { status: 'tooLarge' } | { status: 'outside' }

export type ScenePanelStatusKind =
  'idle' | 'drawing' | 'noPlot' | 'noDrawnArea' | 'tooLarge' | 'outside' | 'error' | 'searching' | 'empty' | 'results'
