import { useCallback } from 'react'
import { State } from '../state'

export const useSelect = () =>
  useCallback(({ state }) => {
    State.getOnSelect(state)(State.getTaxonomy(state))
  }, [])
