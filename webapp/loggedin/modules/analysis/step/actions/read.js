import axios from 'axios'
import * as R from 'ramda'

import * as Step from '@common/analysis/processingStep'

import * as SurveyState from '@webapp/survey/surveyState'
import * as StepState from '@webapp/loggedin/modules/analysis/step/state'

import { validateStep } from './validation'

export const stepDataLoad = 'analysis/step/data/load'

export const fetchStepData = () => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const step = StepState.getProcessingStep(state)
  const stepPrevUuid = R.pipe(StepState.getProcessingStepPrev, Step.getUuid)(state)

  const [{ data: calculations = [] }, { data: stepPrevAttributeUuids = [] }] = await Promise.all([
    axios.get(`/api/survey/${surveyId}/processing-step/${Step.getUuid(step)}/calculations`),
    stepPrevUuid
      ? axios.get(`/api/survey/${surveyId}/processing-step/${stepPrevUuid}/calculation-attribute-uuids`)
      : {},
  ])

  await dispatch({ type: stepDataLoad, calculations, stepPrevAttributeUuids })

  dispatch(validateStep())
}
