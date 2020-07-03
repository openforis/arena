import { useCallback } from 'react'

import * as A from '@core/arena'

import { State } from '../state'

export const useCloseDialog = ({ setState }) =>
  useCallback(async ({ selection, state }) => {
    if (State.getShowDialog(state)) {
      const stateUpdated = A.pipe(
        State.assocShowDialog(false),
        State.assocInputValue(A.isEmpty(selection) ? '' : State.getItemLabel(state)(selection))
      )(state)
      setState(stateUpdated)
    }
  }, [])
