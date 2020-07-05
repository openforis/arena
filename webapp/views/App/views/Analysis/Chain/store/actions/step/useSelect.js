import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'

import { DialogConfirmActions } from '@webapp/store/ui'

import * as Chain from '@common/analysis/processingChain'

import { State } from '../../state'

export const useSelect = ({ setState }) => {
  const dispatch = useDispatch()

  const select = ({ step, state }) => () => {
    setState(
      A.pipe(
        State.assocChainEdit(
          !A.isEmpty(State.getStep(state))
            ? A.pipe(
                Chain.dissocProcessingStepTemporary,
                Chain.assocProcessingStep(State.getStep(state))
              )(State.getChainEdit(state))
            : State.getChainEdit(state)
        ),
        State.assocStep(step),
        State.assocStepEdit(step)
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
