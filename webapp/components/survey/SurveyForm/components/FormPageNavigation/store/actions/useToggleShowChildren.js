import { useCallback } from 'react'

import { State } from '../state'

export const useToggleShowChildren = ({ setState }) => {
  return useCallback(() => {
    setState((state) => State.assocShowChildren(!State.getShowChildren(state))(state))
  }, [])
}
