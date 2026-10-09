import { appModuleUri, dataModules } from '@webapp/app/appModules'

import { DataExplorerActions as SliceActions } from './reducer'
import { toExplorerQuery } from './explorerQuery'

type ShowQueryParams = {
  query: object
  displayType?: string | null
  chartType?: string | null
  navigate?: (path: string) => void
}

/**
 * Shows a query in the Explorer: the same steps for the assistant cards and the Ask AI button.
 * @param {object} params - Parameters.
 * @param {object} params.query - Explorer query (filter not yet normalised).
 * @param {string} [params.displayType] - Display type to set (table or chart); kept as is when missing.
 * @param {string} [params.chartType] - Chart type to set, after the display type.
 * @param {Function} [params.navigate] - Router navigate function; when given, the Explorer is opened.
 * @returns {Function} The thunk.
 */
export const showQuery =
  ({ query, displayType = null, chartType = null, navigate }: ShowQueryParams) =>
  (dispatch: (action: unknown) => unknown): void => {
    dispatch(SliceActions.setSelectedQuerySummaryUuid(null))
    dispatch(SliceActions.setNodeDefsSelectorVisible(true))
    dispatch(SliceActions.setQuery(toExplorerQuery(query)))
    if (displayType) dispatch(SliceActions.setDisplayType(displayType))
    if (chartType) dispatch(SliceActions.setChartType(chartType))
    navigate?.(appModuleUri(dataModules.explorer))
  }
