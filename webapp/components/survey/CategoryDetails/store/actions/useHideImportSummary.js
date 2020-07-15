import { useCallback } from 'react'
import { State } from '../state'

export const useHideImportSummary = ({ setState }) => useCallback(() => setState(State.dissocImportSummary), [])
