import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'
import { AnalysisActions } from '@webapp/service/storage'
import * as Step from '@common/analysis/processingStep'

export const useDelete = ({ step, setStep, calculation, setCalculation }) => {
  const dispatch = useDispatch()

  const resetCalculation = () => {
    AnalysisActions.resetCalculation()
    setCalculation({})
    const stepWithOutCalculation = Step.dissocCalculation(calculation)(step)
    AnalysisActions.persistStep({ step: stepWithOutCalculation })
    setStep(stepWithOutCalculation)
  }

  return () => {
    ;(async () => {
      const calculationDirty = true
      if (calculationDirty) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'common.cancelConfirm',
            onOk: resetCalculation,
          })
        )
      } else {
        resetCalculation()
      }
    })()
  }
}
