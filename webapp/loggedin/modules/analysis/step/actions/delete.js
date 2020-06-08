import axios from 'axios'

import * as Step from '@common/analysis/processingStep'

import { SurveyState } from '@webapp/store/survey'
import * as StepState from '@webapp/loggedin/modules/analysis/step/state'

import { hideAppSaving, showAppSaving } from '@webapp/app/actions'
import { NotificationActions } from '@webapp/store/ui'

export const stepDelete = 'analysis/step/delete'

export const deleteStep = () => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const step = StepState.getProcessingStep(state)

  await axios.delete(`/api/survey/${surveyId}/processing-step/${Step.getUuid(step)}`)

  dispatch({ type: stepDelete })
  dispatch(NotificationActions.notifyInfo({ key: 'processingStepView.deleteComplete' }))
  dispatch(hideAppSaving())
}
