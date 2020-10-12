import { useCallback } from 'react'
import * as A from '@core/arena'

import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'
import * as ChainController from '@common/analysis/chainController'
import * as Step from '@common/analysis/processingStep'

import { State } from '../../state'

export const useDismiss = ({ setState }) => {
  const dispatch = useDispatch()

  const resetStep = () =>
    setState((statePrev) => {
      const chain = State.getChain(statePrev)
      const chainEdit = State.getChainEdit(statePrev)
      const step = State.getStep(statePrev)
      const stepEdit = State.getStepEdit(statePrev)
      let chainEditUpdated
      if (Step.isTemporary(stepEdit)) {
        chainEditUpdated = chain
      } else {
        chainEditUpdated = ChainController.dissocStepTemporary({ chain: chainEdit })
        chainEditUpdated = ChainController.assocStep({ chain: chainEditUpdated, step })
      }

      return A.pipe(State.assocChainEdit(chainEditUpdated), State.dissocStep, State.dissocStepEdit)(statePrev)
    })

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
