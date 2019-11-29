import axios from 'axios'
import * as R from 'ramda'

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
    const activityLogState = ActivityLogState.getState(state)
    const survey = SurveyState.getSurvey(state)
    const surveyId = Survey.getId(survey)
    const i18n = AppState.getI18n(state)

    const { data: { activityLogs } } = await axios.get(
      `/api/survey/${surveyId}/activity-log`,
      { params: { offset, limit } }
    )
    
    // add new messages to messages already in state and sort them by creation date in reverse order
    const activityLogMessages = R.pipe(
      R.map(ActivityLogMessageParser.toMessage(i18n, survey)),
      R.concat(ActivityLogState.getMessages(activityLogState)),
      R.uniq,
      R.sortBy(R.compose(Number, ActivityLogMessage.getId)),
      R.reverse
    )(activityLogs)  

    dispatch({ type: homeActivityMessagesUpdate, offset, limit, activityLogMessages })
  } catch (e) {
    console.log(e)
  }
}

export const fetchActivityLogsNext = () => (dispatch, getState) => {
  const state = getState()
  const offset = ActivityLogState.getOffset(state)
  const limit = ActivityLogState.getLimit(state)
  
  dispatch(fetchActivityLogs(offset + limit))
}

export const resetActivityLogs = () => dispatch => dispatch({ type: homeActivityMessagesReset })