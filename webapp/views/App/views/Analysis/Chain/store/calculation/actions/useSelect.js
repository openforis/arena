import * as A from '@core/arena'
import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'

import { useReset } from './useReset'

export const useSelect = ({
  chain,
  setChain,
  step,
  setStep,
  setDirty,
  calculation,

  state,
  setState,
  State,
}) => {
  const dispatch = useDispatch()

  const calculationDirty = State.getCalculationDirty(state)

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

  const select = ({ calculationSelected }) => {
    setState(
      State.assoc({
        calculation: calculationSelected,
        calculationOriginal: calculationSelected,
        calculationDirty: null,
      })(state)
    )
  }

  const selectWithReset = ({ calculationSelected }) => () => {
    reset()
    select({ calculationSelected })
  }

  return (calculationSelected) => {
    ;(async () => {
      if (calculationDirty && !A.isEmpty(calculation)) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'processingStepCalculation.deleteConfirm',
            onOk: selectWithReset({ calculationSelected }),
          })
        )
      } else {
        select({ calculationSelected })
      }
    })()
  }
}
