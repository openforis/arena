import axios from 'axios'
import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'
import { useParams } from 'react-router'

export const useDelete = ({ stepState, StepState, State, state, setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const { chainUuid } = useParams()

  const { calculation, calculationDirty } = State.get(state)
  const step = StepState.getStep(stepState)

  const resetCalculation = async () => {
    const calculationUuid = Calculation.getUuid(calculation)

    const stepWithOutCalculation = Step.dissocCalculation(calculation)(step)

    if (chainUuid && !Calculation.isTemporary(calculation)) {
      await axios.delete(`/api/survey/${surveyId}/processing-step/${Step.getUuid(step)}/calculation/${calculationUuid}`)
      dispatch(SurveyActions.chainItemDelete())
    }

    StepState.setState({
      step: stepWithOutCalculation,
    })

    setState({
      calculation: null,
      calculationDirty: null,
    })
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
