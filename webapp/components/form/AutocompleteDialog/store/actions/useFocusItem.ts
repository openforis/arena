import { useCallback } from 'react'

import { State } from '../state'

export const useFocusItem = ({ setState }) =>
  useCallback(({ list, index }) => {
    const itemEl = list.current.children[index]
    itemEl.focus()
    setState(State.assocFocusedItemIndex(index))
  }, [])
