import axios from 'axios'

import { JobActions } from '@webapp/store/app'

import * as SurveyState from '../state'

import { setActiveSurvey } from './active'

export const unpublishSurvey = () => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)

  const { data } = await axios.put(`/api/survey/${surveyId}/unpublish`)

  dispatch(
    JobActions.showJobMonitor({
      job: data.job,
      onComplete: async () => {
        await dispatch(setActiveSurvey(surveyId, true))
      },
    })
  )
}
