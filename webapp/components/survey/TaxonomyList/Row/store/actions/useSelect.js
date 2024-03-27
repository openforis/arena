import { useCallback } from 'react'

import { State } from '../state'

export const useSelect = () =>
  useCallback(({ state }) => {
    const onSelect = State.getOnSelect(state)
    if (onSelect) {
      onSelect(State.getTaxonomy(state))
    }
  }, [])
