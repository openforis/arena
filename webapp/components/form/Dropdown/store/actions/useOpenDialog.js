import { useCallback } from 'react'

import * as A from '@core/arena'

import { State } from '../state'
import { getItemsDialog } from './getItemsDialog'

export const useOpenDialog = ({ setState }) =>
  useCallback(async ({ state }) => {
    if (!State.getDisabled(state) && !State.getReadOnly(state) && !State.getShowDialog(state)) {
      // show all items if autocompleteMinChars is 0
      const value = State.getAutocompleteMinChars(state) > 0 ? State.getInputValue(state) : ''
      const stateUpdated = A.pipe(
        State.assocShowDialog(true),
        State.assocItemsDialog(await getItemsDialog({ state, value }))
      )(state)
      setState(stateUpdated)
    }
  }, [])
