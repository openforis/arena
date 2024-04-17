import { useSelector } from 'react-redux'

import { DataExplorerState } from './state'

export const DataExplorerSelectors = {
  useQuery: () => useSelector(DataExplorerState.getQuery),
  useSelectedQuerySummaryUuid: () => useSelector(DataExplorerState.getSelectedQuerySummaryUuid),
}
