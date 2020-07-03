import * as A from '@core/arena'
import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'

import { useReset } from './useReset'

export const useSelect = ({
  chain,
  setChain,
  setDirty,

  stepState,
  StepState,

  state,
  setState,
  State,
}) => {
  const dispatch = useDispatch()

  const { calculation, calculationDirty } = State.get(state)

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

  const select = ({ calculationSelected }) => {
    setState({
      calculation: calculationSelected,
      calculationOriginal: calculationSelected,
      calculationDirty: null,
    })
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
