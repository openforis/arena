import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'

import { useReset } from './useReset'

export const useDismiss = ({ chain, setChain, step, setStep, setDirty, state, setState, State }) => {
  const dispatch = useDispatch()

  const reset = useReset({
    chain,
    setChain,
    step,
    setStep,
    setDirty,
    state,
    setState,
    State,
  })

  const resetCalculation = async () => {
    reset()
    setState(
      State.assoc({
        calculation: null,
        calculationDirty: null,
      })
    )
  }
  const calculationDirty = State.getCalculationDirty(state)

  return () => {
    ;(async () => {
      if (calculationDirty) {
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
