import { useCallback } from 'react'

import { State } from '../../state'

export const useSetImportSummaryColumnDataType = ({ setState }) =>
  useCallback(
    ({ columnName, dataType }) => setState(State.assocImportSummaryColumnDataType({ columnName, dataType })),
    []
  )
