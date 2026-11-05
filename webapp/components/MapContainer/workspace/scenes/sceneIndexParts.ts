import { getPeriodMonthKeys } from './scenePeriod'
import type { RowGroupInfo, ScenePeriod } from './sceneTypes'

// Earth Search sentinel-2-c1-l2a as STAC GeoParquet on Source Cooperative (CORS: *).
export const SCENE_INDEX_BASE_URL = 'https://data.source.coop/tge-labs/s2-stac-geoparquet/sentinel-2-c1-l2a'
// Rows are sorted by this column, so its row-group min/max prune almost every group.
export const SCENE_INDEX_TILE_COLUMN = '_tile'

type StatisticsLike = { min_value?: unknown; max_value?: unknown; min?: unknown; max?: unknown }
type ColumnChunkLike = { meta_data?: { path_in_schema?: string[]; statistics?: StatisticsLike } }

// The part of hyparquet's FileMetaData we use (kept structural so tests need no hyparquet).
export type ParquetMetadataLike = {
  row_groups: Array<{ num_rows: bigint | number; columns: ColumnChunkLike[] }>
}

const textDecoder = new TextDecoder()

/**
 * Lists the index files a period needs: per year `items.parquet`, then `live-MM.parquet` for each month of
 * that year in the period. Months already folded into `items.parquet` answer 404 and are skipped by the
 * reader; the emptied `live.parquet` is never listed.
 *
 * @param {ScenePeriod} period - The period.
 * @param {string} [baseUrl] - Index root (tests pass their own).
 * @returns {string[]} File URLs, items before live tails of the same year.
 */
export const getIndexPartUrls = (period: ScenePeriod, baseUrl: string = SCENE_INDEX_BASE_URL): string[] => {
  const urls: string[] = []
  let currentYear: string | null = null
  for (const monthKey of getPeriodMonthKeys(period)) {
    const [year, month] = monthKey.split('-')
    if (year !== currentYear) {
      urls.push(`${baseUrl}/year=${year}/items.parquet`)
      currentYear = year
    }
    urls.push(`${baseUrl}/year=${year}/live-${month}.parquet`)
  }
  return urls
}

/**
 * Converts a statistics value (string, or raw UTF-8 bytes) to a string.
 *
 * @param {unknown} value - Statistics value.
 * @returns {string|null} String, or null when missing or of another type.
 */
const statisticToString = (value: unknown): string | null => {
  if (typeof value === 'string') return value
  if (value instanceof Uint8Array) return textDecoder.decode(value)
  return null
}

/**
 * Finds the statistics of a column in a row group.
 *
 * @param {ColumnChunkLike[]} columns - Column chunks of the row group.
 * @param {string} column - Column name.
 * @returns {StatisticsLike|undefined} Statistics, if any.
 */
const findStatistics = (columns: ColumnChunkLike[], column: string): StatisticsLike | undefined =>
  columns.find((chunk) => chunk.meta_data?.path_in_schema?.join('.') === column)?.meta_data?.statistics

/**
 * Lists the row groups of a file with their row range and the min/max of a column.
 *
 * @param {ParquetMetadataLike} metadata - Parquet footer metadata.
 * @param {string} column - Column whose statistics are read (the tile column).
 * @returns {RowGroupInfo[]} Row groups in file order.
 */
export const getRowGroupInfos = (metadata: ParquetMetadataLike, column: string): RowGroupInfo[] => {
  const groups: RowGroupInfo[] = []
  let rowStart = 0
  for (const [index, rowGroup] of metadata.row_groups.entries()) {
    const rowCount = Number(rowGroup.num_rows)
    const statistics = findStatistics(rowGroup.columns, column)
    groups.push({
      index,
      rowStart,
      rowEnd: rowStart + rowCount,
      tileMin: statisticToString(statistics?.min_value ?? statistics?.min),
      tileMax: statisticToString(statistics?.max_value ?? statistics?.max),
    })
    rowStart += rowCount
  }
  return groups
}

/**
 * Tells whether a row group may hold a tile; a group without statistics may hold anything.
 *
 * @param {RowGroupInfo} group - Row group.
 * @param {string} tile - Tile id.
 * @returns {boolean} True when the group must be read.
 */
const mayContainTile = (group: RowGroupInfo, tile: string): boolean =>
  group.tileMin === null || group.tileMax === null || (group.tileMin <= tile && tile <= group.tileMax)

/**
 * Keeps the row groups that may hold any of the tiles.
 *
 * @param {RowGroupInfo[]} groups - Row groups of a file.
 * @param {string[]} tiles - Tile ids.
 * @returns {RowGroupInfo[]} Groups to read.
 */
export const selectRowGroups = (groups: RowGroupInfo[], tiles: string[]): RowGroupInfo[] =>
  groups.filter((group) => tiles.some((tile) => mayContainTile(group, tile)))
