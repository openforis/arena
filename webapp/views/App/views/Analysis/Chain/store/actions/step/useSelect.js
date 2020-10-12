import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'

import { DialogConfirmActions } from '@webapp/store/ui'

import * as ChainController from '@common/analysis/chainController'
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
          ? ChainController.assocStep({ chain: chainEditPrev, step: stepPrev })
          : ChainController.dissocStepTemporary({ chain: chainEditPrev })

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
