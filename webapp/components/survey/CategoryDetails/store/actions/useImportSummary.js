import { useCallback } from 'react'
import { State } from '../state'

export const useHideImportSummary = ({ setState }) => useCallback(() => setState(State.dissocImportSummary))

export const useSetImportSummaryColumnDataType = ({ setState }) =>
  useCallback(({ columnName, dataType }) => setState(State.assocImportSummaryColumnDataType({ columnName, dataType })))
