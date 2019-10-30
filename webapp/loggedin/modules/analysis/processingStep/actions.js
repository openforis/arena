import axios from 'axios'

import { hideAppSaving, showAppSaving } from '@webapp/app/actions'

import * as SurveyState from '@webapp/survey/surveyState'

export const processingStepUpdate = 'analysis/processingStep/update'

export const resetProcessingStepState = () => dispatch =>
  dispatch({ type: processingStepUpdate, processingStep: {} })

// ====== READ

export const fetchProcessingStep = processingStepUuid => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const surveyId = SurveyState.getSurveyId(getState())
  const { data: processingStep } = await axios.get(`/api/survey/${surveyId}/processing-step/${processingStepUuid}`)

  dispatch({ type: processingStepUpdate, processingStep })
  dispatch(hideAppSaving())
}
