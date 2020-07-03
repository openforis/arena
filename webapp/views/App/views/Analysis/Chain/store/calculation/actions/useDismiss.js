import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'

import { useReset } from './useReset'

export const useDismiss = ({ chain, setChain, setDirty, stepState, StepState, state, setState, State }) => {
  const dispatch = useDispatch()

  const reset = useReset({
    chain,
    setChain,
    setDirty,

    stepState,
    StepState,

    state,
    setState,
    State,
  })

  const resetCalculation = async () => {
    reset()
    setState({
      calculation: null,
      calculationDirty: null,
    })
  }

  return () => {
    ;(async () => {
      if (State.getCalculationDirty(state)) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'processingStepCalculation.deleteConfirm',
            onOk: resetCalculation,
          })
        )
      } else {
        await resetCalculation()
      }
    })()
  }
}
