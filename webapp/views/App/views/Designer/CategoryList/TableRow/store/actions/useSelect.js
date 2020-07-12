import { useCallback } from 'react'

import { State } from '../state'
import { State as ListState } from '../../../store'

export const useSelect = ({ setState }) =>
  useCallback(() => {
    setState((state) => {
      const listState = State.getListState(state)
      const category = State.getCategory(state)
      const onSelect = ListState.getOnSelect(listState)

      onSelect(category)

      return state
    })
  }, [])
