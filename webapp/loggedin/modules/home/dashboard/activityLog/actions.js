import axios from 'axios'

import * as Survey from '@core/survey/survey'

import * as SurveyState from '@webapp/survey/surveyState'
import * as AppState from '@webapp/app/appState'

import * as ActivityLogMessageParser from './activityLogMessageParser'

export const homeActivityMessagesUpdate = 'home/activityLog/messages/update'
export const homeActivityMessagesReset = 'home/activityLog/messages/reset'

export const fetchActivityLogs = (offset = 0, limit = 30) => async (
  dispatch,
  getState,
) => {
  try {
    const state = getState()
    const survey = SurveyState.getSurvey(state)
    const surveyId = Survey.getId(survey)
    const i18n = AppState.getI18n(state)

    const {
      data: { activityLogs },
    } = await axios.get(`/api/survey/${surveyId}/activity-log`, {
      params: { offset, limit },
    })

    const activityLogMessages = activityLogs.map(
      ActivityLogMessageParser.toMessage(i18n, survey),
    )

    dispatch({ type: homeActivityMessagesUpdate, activityLogMessages })
  } catch (error) {
    console.log(error)
  }
}

export const resetActivityLogs = () => dispatch =>
  dispatch({ type: homeActivityMessagesReset })
