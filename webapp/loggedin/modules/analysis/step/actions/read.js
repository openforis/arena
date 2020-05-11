import axios from 'axios'
import * as R from 'ramda'

import * as Step from '@common/analysis/processingStep'

import * as SurveyState from '@webapp/survey/surveyState'
import * as StepState from '@webapp/loggedin/modules/analysis/step/state'

export const stepPrevAttributeUuidsUpdate = 'analysis/step/prev/attributeUuids/update'

export const fetchStepPrevAttributeUuids = () => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const stepPrevUuid = R.pipe(StepState.getProcessingStepPrev, Step.getUuid)(state)

  if (stepPrevUuid) {
    const { data: stepPrevAttributeUuids = [] } = await axios.get(
      `/api/survey/${surveyId}/processing-step/${stepPrevUuid}/calculation-attribute-uuids`
    )

    dispatch({ type: stepPrevAttributeUuidsUpdate, stepPrevAttributeUuids })
  }
}
