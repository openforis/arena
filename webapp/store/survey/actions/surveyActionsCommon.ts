import { JobActions } from '@webapp/store/app'

import * as SurveyState from '../state'
import { setActiveSurvey } from './active'

export const waitForJobAndSetActiveSurvey = ({ dispatch, getState, job }) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)

  dispatch(
    JobActions.showJobMonitor({
      job,
      onComplete: async () => {
        await dispatch(setActiveSurvey(surveyId, true))
      },
    })
  )
}
