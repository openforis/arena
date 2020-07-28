import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'

import { DialogConfirmActions } from '@webapp/store/ui'

import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'

import { State } from '../../state'

export const useSelect = ({ setState }) => {
  const dispatch = useDispatch()

  const select = ({ step, state }) => () => {
    const stepEdit = State.getStepEdit(state)
    const chainUpdated = State.getChainEdit(state)

    setState(
      A.pipe(
        State.assocChainEdit(
          !A.isEmpty(stepEdit) && !Step.isTemporary(stepEdit)
            ? Chain.assocProcessingStep(State.getStep(state))(chainUpdated)
            : Chain.dissocProcessingStepTemporary(chainUpdated)
        ),
        State.assocStep(step),
        State.assocStepEdit(step),
        State.dissocCalculation,
        State.dissocCalculationEdit
      )(state)
    )
  }

  return useCallback(({ step, state }) => {
    const stepDirty = State.isStepDirty(state)
    if (stepDirty) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'common.cancelConfirm',
          onOk: select({ step, state }),
        })
      )
    } else {
      select({ step, state })()
    }
  }, [])
}
