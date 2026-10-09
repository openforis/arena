import { DataExplorerState } from '@webapp/store/dataExplorer/state'

export const tablePageSize = 15

/**
 * Returns the row limit of the Explorer queries for a display type.
 * @param {string|null} [displayType] - Explorer display type (table or chart).
 * @returns {number} The chart cap for charts, one table page otherwise.
 */
export const getQueryLimitForDisplayType = (displayType?: string | null): number =>
  displayType === DataExplorerState.displayTypes.chart ? DataExplorerState.chartMaxItems : tablePageSize
