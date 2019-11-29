import axios from 'axios'
import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as Survey from '@core/survey/survey'

import * as SurveyState from '@webapp/survey/surveyState'
import * as AppState from '@webapp/app/appState'
import * as ActivityLogState from '@webapp/loggedin/modules/home/dashboard/activityLog/activityLogState'

import * as ActivityLogMessage from './activityLogMessage'
import * as ActivityLogMessageParser from './activityLogMessageParser'

export const homeActivityMessagesUpdate = 'home/activityLog/messages/update'
export const homeActivityMessagesReset = 'home/activityLog/messages/reset'

export const fetchActivityLogs = (offset = 0, limit = 30) => async (dispatch, getState) => {
  try {
    const state = getState()
    const survey = SurveyState.getSurvey(state)
    const surveyId = Survey.getId(survey)
    const i18n = AppState.getI18n(state)

    const { data: { activityLogs } } = await axios.get(
      `/api/survey/${surveyId}/activity-log`,
      { params: { offset, limit } }
    )
    
    // add new messages to messages already in state and sort them by creation date in reverse order
    const messagesState = R.pipe(
      ActivityLogState.getState,
      R.when(
        R.isEmpty,
        R.always([])
      )
    )(state)
    
    const activityLogMessages = R.pipe(
      R.map(ActivityLogMessageParser.toMessage(i18n, survey)),
      R.concat(messagesState),
      R.uniq,
      R.sortBy(R.compose(Number, ActivityLogMessage.getId)),
      R.reverse
    )(activityLogs)  

    dispatch({ type: homeActivityMessagesUpdate, activityLogMessages })
  } catch (e) {
    console.log(e)
  }
}

export const resetActivityLogs = () => dispatch => dispatch({ type: homeActivityMessagesReset })