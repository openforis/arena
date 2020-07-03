import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'

import { useReset } from './useReset'

export const useDismiss = ({ chain, setChain, state, setState, State }) => {
  const dispatch = useDispatch()

  const stepDirty = State.getStepDirty(state)
  const reset = useReset({
    chain,
    setChain,
    state,
    setState,
    State,
  })

  const resetStep = async () => {
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
        await resetStep()
      }
    })()
  }
}
