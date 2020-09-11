import { useCallback } from 'react'
import * as A from '@core/arena'

import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'

import { State } from '../../state'

export const useDismiss = ({ setState }) => {
  const dispatch = useDispatch()

  const resetStep = () => {
    setState((statePrev) => {
      const chainEditPrev = State.getChainEdit(statePrev)
      const stepEditPrev = State.getStepEdit(statePrev)
      const chainEditUpdated = Step.isTemporary(stepEditPrev)
        ? State.getChain(statePrev)
        : A.pipe(
            Chain.dissocProcessingStepTemporary,
            Chain.assocProcessingStep(State.getStep(statePrev))
          )(chainEditPrev)

      return A.pipe(State.assocChainEdit(chainEditUpdated), State.dissocStep, State.dissocStepEdit)(statePrev)
    })
  }

  return useCallback(({ state }) => {
    if (State.isStepDirty(state)) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'common.cancelConfirm',
          onOk: resetStep,
        })
      )
    } else {
      resetStep()
    }
  }, [])
}
