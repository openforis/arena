import { useCallback } from 'react'
import axios from 'axios'
import { useParams } from 'react-router'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { State } from '../../state'

export const useDelete = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const { chainUuid } = useParams()

  const deleteCalculation = ({ state }) => async () => {
    const calculationToDelete = State.getCalculationEdit(state)
    const calculationUuid = Calculation.getUuid(calculationToDelete)
    const stepEdit = State.getStepEdit(state)

    if (chainUuid && !Calculation.isTemporary(calculationToDelete)) {
      await axios.delete(
        `/api/survey/${surveyId}/processing-step/${Step.getUuid(stepEdit)}/calculation/${calculationUuid}`
      )
      dispatch(SurveyActions.chainItemDelete())
    }

    const stepWithOutCalculation = Step.dissocCalculation(calculationToDelete)(State.getStepEdit(state))

    setState(
      A.pipe(
        State.assocStep(stepWithOutCalculation),
        State.assocStepEdit(stepWithOutCalculation),
        State.dissocCalculation,
        State.dissocCalculationEdit
      )(state)
    )

    dispatch(NotificationActions.notifyInfo({ key: 'processingStepCalculation.deleteComplete' }))
  }

  return useCallback(async ({ state }) => {
    const stepDirty = State.isStepDirty(state)
    if (stepDirty) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'processingStepView.deleteConfirm',
          onOk: deleteCalculation({ state }),
        })
      )
    } else {
      await deleteCalculation({ state })()
    }
  }, [])
}
