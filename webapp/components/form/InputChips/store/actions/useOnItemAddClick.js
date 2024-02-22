import { useCallback } from 'react'

import { State } from '../state'

export const useOnItemAddClick = ({ onChange, setState }) =>
  useCallback(
    ({ selection }) => {
      setState((statePrev) => {
        const value = State.getInputFieldValue(statePrev)
        onChange([...selection, value])
        return State.assocInputFieldValue('')(statePrev)
      })
    },
    [onChange, setState]
  )
