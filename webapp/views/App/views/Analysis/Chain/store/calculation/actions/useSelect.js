import * as A from '@core/arena'
import { useDispatch } from 'react-redux'

import { AnalysisActions } from '@webapp/service/storage'
import { DialogConfirmActions } from '@webapp/store/ui'

import { useReset } from '@webapp/views/App/views/Analysis/Chain/store/calculation/actions/useReset'

export const useSelect = ({
  chain,
  setChain,
  step,
  setStep,
  setDirty,
  calculation,
  originalCalculation,

  calculationDirty,

  setCalculation,
  setOriginalCalculation,
  setCalculationDirty,
}) => {
  const dispatch = useDispatch()

  const reset = useReset({
    chain,
    setChain,
    step,
    setStep,
    setDirty,
    calculation,
    originalCalculation,
    setCalculation,
    setCalculationDirty,
  })

  const select = ({ calculationSelected }) => {
    setCalculation(calculationSelected)
    setOriginalCalculation(calculationSelected)
    AnalysisActions.persistCalculation({ calculation: calculationSelected, calculationDirty: false })
    setCalculationDirty(false)
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
