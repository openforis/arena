import { useCallback } from 'react'
import * as A from '@core/arena'

import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'

import { State } from '../../state'

export const useDismiss = ({ setState }) => {
  const dispatch = useDispatch()

  const resetStep = ({ state }) => () => {
    setState(
      A.pipe(
        State.assocChainEdit(
          Step.isTemporary(State.getStepEdit(state))
            ? State.getChain(state)
            : A.pipe(
                Chain.dissocProcessingStepTemporary,
                Chain.assocProcessingStep(State.getStep(state))
              )(State.getChainEdit(state))
        ),
        State.dissocStep,
        State.dissocStepEdit
      )(state)
    )
  }

  return useCallback(({ state }) => {
    const stepDirty = State.isStepDirty(state)
    if (stepDirty) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'common.cancelConfirm',
          onOk: resetStep({ state }),
        })
      )
    } else {
      resetStep({ state })()
    }
  }, [])
}
