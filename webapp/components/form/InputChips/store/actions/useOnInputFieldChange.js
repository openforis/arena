import { useCallback } from 'react'

import { State } from '../state'

export const useOnInputFieldChange = ({ setState }) =>
  useCallback(
    (value) => {
      setState((statePrev) => {
        const textTransformFunction = State.getTextTransformFunction(statePrev)
        const valueTransformed = textTransformFunction?.(value) ?? value
        return State.assocInputFieldValue(valueTransformed)(statePrev)
      })
    },
    [setState]
  )
