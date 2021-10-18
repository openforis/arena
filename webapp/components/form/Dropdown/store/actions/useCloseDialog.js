import { useCallback } from 'react'

import * as A from '@core/arena'

import { State } from '../state'

export const useCloseDialog = ({ setState }) =>
  useCallback(({ selection }) => {
    setState((state) => {
      let stateUpdated = State.assocShowDialog(false)(state)
      stateUpdated = State.assocInputValue(
        A.isEmpty(selection) ? '' : State.getItemLabelFunction(state)(selection),
        stateUpdated
      )
      return stateUpdated
    })
  }, [])
