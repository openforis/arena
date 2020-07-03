import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'

import { useReset } from './useReset'

export const useDismiss = ({ chainState, ChainState, state, setState, State }) => {
  const dispatch = useDispatch()

  const stepDirty = State.getStepDirty(state)
  const reset = useReset({
    chainState,
    ChainState,
    state,
    setState,
    State,
  })

  const resetStep = () => {
    reset()

    setState({
      step: null,
      stepDirty: null,
    })
  }

  return () => {
    ;(async () => {
      if (stepDirty) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'processingStepCalculation.deleteConfirm',
            onOk: resetStep,
          })
        )
      } else {
        resetStep()
      }
    })()
  }
}
