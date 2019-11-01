import axios from 'axios'

import * as Survey from '@core/survey/survey'

import * as SurveyState from '@webapp/survey/surveyState'
import * as AppState from '@webapp/app/appState'

import * as MessageGenerator from './messageGenerator'

export const homeActivityLogsUpdate = 'home/activityLogs/update'
export const homeActivityLogsReset = 'home/activityLogs/reset'

export const fetchActivityLogs = (offset = 0, limit = 30) =>
  async (dispatch, getState) => {
    try {
      const state = getState()
      const survey = SurveyState.getSurvey(state)
      const surveyId = Survey.getId(survey)
      const i18n = AppState.getI18n(state)

      const { data } = await axios.get(`/api/survey/${surveyId}/activity-log`, { params: { offset, limit } })

      const activityLogs = data.activityLogs.map(activityLog => ({
        ...activityLog,
        ...MessageGenerator.generate(i18n, survey, activityLog)
      }))

      dispatch({ type: homeActivityLogsUpdate, activityLogs })
    } catch (e) {
      console.log(e)
    }
  }

export const resetActivityLogs = () => dispatch => dispatch({ type: homeActivityLogsReset })