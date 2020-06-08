import axios from 'axios'

import * as JobActions from '@webapp/loggedin/appJob/actions'

import * as SurveyState from '../state'
import { setActiveSurvey } from './active'
import { initSurveyDefs } from './defs'

export const publishSurvey = () => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)

  const { data } = await axios.put(`/api/survey/${surveyId}/publish`)

  dispatch(
    JobActions.showAppJobMonitor(data.job, async () => {
      await dispatch(setActiveSurvey(surveyId, true))
      await dispatch(initSurveyDefs(true, true))
    })
  )
}
