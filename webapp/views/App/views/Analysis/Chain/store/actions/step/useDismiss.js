import { useCallback } from 'react'
import * as A from '@core/arena'

import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'

import { State } from '../../state'

export const useDismiss = ({ setState }) => {
  const dispatch = useDispatch()

  /* const reset = useReset({
    chainState,
    ChainState,
    state,
    setState,
    State,
  }) */

  const resetStep = ({ state }) => () => {
    // reset()
    setState(A.pipe(State.dissocStep, State.dissocStepEdit)(state))
  }

  return useCallback(({ state }) => {
    const stepDirty = State.isStepDirty(state)
    if (stepDirty) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'processingStepCalculation.deleteConfirm',
          onOk: resetStep({ state }),
        })
      )
    } else {
      resetStep({ state })()
    }
  }, [])
}
