import { useSelector } from 'react-redux'

import { DataExplorerState } from './state'

export const DataExplorerSelectors = {
  useDisplayType: () => useSelector(DataExplorerState.getDisplayType),
  useIsNodeDefsSelectorVisible: () => useSelector(DataExplorerState.isNodeDefsSelectorVisible),
  useQuery: () => useSelector(DataExplorerState.getQuery),
  useSelectedQuerySummaryUuid: () => useSelector(DataExplorerState.getSelectedQuerySummaryUuid),
}
