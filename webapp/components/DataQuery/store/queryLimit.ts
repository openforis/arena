import { DataExplorerState } from '@webapp/store/dataExplorer/state'

export const tablePageSize = 15

/**
 * Returns the row limit of the Explorer queries for a display type.
 * @param {string|null} [displayType] - Explorer display type (table or chart).
 * @returns {number} The chart cap for charts, one table page otherwise.
 */
export const getQueryLimitForDisplayType = (displayType?: string | null): number =>
  displayType === DataExplorerState.displayTypes.chart ? DataExplorerState.chartMaxItems : tablePageSize

/**
 * Returns true when a chart is displayed with more rows than it can show (only the first chartMaxItems are loaded).
 * @param {object} params - Parameters.
 * @param {string|null} [params.displayType] - Explorer display type (table or chart).
 * @param {number|null} [params.count] - Total row count of the query.
 * @returns {boolean} Whether the chart shows partial data.
 */
export const isChartTruncated = ({ displayType, count }: { displayType?: string | null; count?: number | null }) =>
  displayType === DataExplorerState.displayTypes.chart && Number(count) > DataExplorerState.chartMaxItems
