import { useCallback } from 'react'

import * as A from '@core/arena'

import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'

// import { useReset } from './useReset'
import { State } from '../../state'

export const useSelect = ({ setState }) => {
  const dispatch = useDispatch()

  /* const reset = useReset({
    chainState,
    ChainState,
    state,
    setState,
    State,
  }) */

  const select = ({ step, state }) => {
    setState(A.pipe(State.assocStep(step), State.assocStepEdit(step))(state))
  }

  const selectWithReset = ({ step, state }) => () => {
    // reset()
    select({ step, state })
  }

  return useCallback(({ step, state }) => {
    const stepDirty = State.isStepDirty(state)
    if (stepDirty) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'processingStepCalculation.deleteConfirm',
          onOk: selectWithReset({ step, state }),
        })
      )
    } else {
      select({ step, state })
    }
  }, [])
}
