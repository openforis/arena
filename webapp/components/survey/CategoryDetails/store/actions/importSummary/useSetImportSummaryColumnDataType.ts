import { useCallback } from 'react'

import { State } from '../../state'

export const useSetImportSummaryColumnDataType = ({ setState }) =>
  useCallback(({ key, dataType }) => setState(State.assocImportSummaryItemDataType({ key, dataType })), [])
