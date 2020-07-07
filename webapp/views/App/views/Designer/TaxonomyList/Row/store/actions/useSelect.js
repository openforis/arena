import { useCallback } from 'react'
import { State } from '../state'

export const useSelect = () =>
  useCallback(({ state }) => {
    State.getOnSelectTaxonomy(state)(State.getTaxonomy(state))
  }, [])
