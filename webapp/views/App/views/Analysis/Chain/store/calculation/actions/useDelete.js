import axios from 'axios'
import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'
import { AnalysisActions } from '@webapp/service/storage'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'
import { useParams } from 'react-router'

export const useDelete = ({ step, setStep, calculation, calculationDirty, setCalculation, setCalculationDirty }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const { chainUuid } = useParams()

  const resetCalculation = async () => {
    const calculationUuid = Calculation.getUuid(calculation)
    AnalysisActions.resetCalculation()
    setCalculation(null)
    const stepWithOutCalculation = Step.dissocCalculation(calculation)(step)

    if (chainUuid && !Calculation.isTemporary(calculation)) {
      await axios.delete(`/api/survey/${surveyId}/processing-step/${Step.getUuid(step)}/calculation/${calculationUuid}`)
      dispatch(SurveyActions.chainItemDelete())
    }

    AnalysisActions.persistStep({ step: stepWithOutCalculation, stepDirty: true })
    setStep(stepWithOutCalculation)
    setCalculationDirty(null)
  }

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
