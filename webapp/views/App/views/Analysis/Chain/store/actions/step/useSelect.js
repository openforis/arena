import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'

import { DialogConfirmActions } from '@webapp/store/ui'

import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'

import { State } from '../../state'

export const useSelect = ({ setState }) => {
  const dispatch = useDispatch()

  const select = ({ step }) => {
    setState((statePrev) => {
      const chainEditPrev = State.getChainEdit(statePrev)
      const stepPrev = State.getStep(statePrev)
      const stepEditPrev = State.getStepEdit(statePrev)

      const chainEditUpdated =
        !A.isEmpty(stepEditPrev) && !Step.isTemporary(stepEditPrev)
          ? Chain.assocProcessingStep(stepPrev)(chainEditPrev)
          : Chain.dissocProcessingStepTemporary(chainEditPrev)

      return A.pipe(
        State.assocChainEdit(chainEditUpdated),
        State.assocStep(step),
        State.assocStepEdit(step),
        State.dissocCalculation,
        State.dissocCalculationEdit
      )(statePrev)
    })
  }

  return useCallback(({ step, state }) => {
    if (State.isStepDirty(state) || State.isCalculationDirty(state)) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'common.cancelConfirm',
          onOk: () => select({ step }),
        })
      )
    } else {
      select({ step })
    }
  }, [])
}
