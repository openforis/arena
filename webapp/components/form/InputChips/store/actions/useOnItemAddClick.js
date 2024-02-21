import { useCallback } from 'react'

import { State } from '../state'

export const useOnItemAddClick = ({ setState }) =>
  useCallback(() => {
    setState((statePrev) => {
      const value = State.getInputFieldValue(statePrev)
    })
  }, [setState])
