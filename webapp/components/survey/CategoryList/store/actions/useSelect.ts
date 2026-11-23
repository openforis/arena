import { useCallback } from 'react'

import { State } from '../state'

export const useSelect = ({ setState }) =>
  useCallback(({ category }) => {
    setState((statePrev) => {
      const onSelect = State.getOnSelect(statePrev)

      onSelect(category)

      return statePrev
    })
  }, [])
