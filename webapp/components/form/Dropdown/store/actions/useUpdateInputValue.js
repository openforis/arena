import { useCallback } from 'react'

import { State } from '../state'
import { getItemsDialog } from './getItemsDialog'

export const useUpdateInputValue = ({ setState }) =>
  useCallback(async ({ value = '', state }) => {
    const itemsDialog = await getItemsDialog({ state, value })
    let stateUpdated = State.assocInputValue(value, state)
    stateUpdated = State.assocItemsDialog(itemsDialog)(stateUpdated)
    setState(stateUpdated)
  }, [])
