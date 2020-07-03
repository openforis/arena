import { useCallback } from 'react'

import * as A from '@core/arena'

import { State } from '../state'
import { getItemsDialog } from './getItemsDialog'

export const useUpdateInputValue = ({ setState }) =>
  useCallback(async ({ value = '', state }) => {
    const itemsDialog = await getItemsDialog({ state, value })
    const stateUpdated = A.pipe(State.assocInputValue(value), State.assocItemsDialog(itemsDialog))(state)
    setState(stateUpdated)
  }, [])
