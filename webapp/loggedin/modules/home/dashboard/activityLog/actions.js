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

const _fetchActivityLogs = async (state, offset = 0, limit = 10) => {
  try {
    const activityLogState = ActivityLogState.getState(state)
    const activityLogMessagesState = ActivityLogState.getMessages(activityLogState)
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
      R.concat(activityLogMessagesState),
      R.uniq,
      R.sortBy(R.compose(Number, ActivityLogMessage.getId)),
      R.reverse
    )(activityLogs)

    return R.length(activityLogMessages) === R.length(activityLogMessagesState)
      ? null
      : activityLogMessages
  } catch (e) {
    console.log(e)
  }
}

export const fetchActivityLogsNewest = () => async (dispatch, getState) => {
  const activityLogMessages = await _fetchActivityLogs(getState())
  if (activityLogMessages)
    dispatch({ type: homeActivityMessagesUpdate, activityLogMessages, offset: 0, limit: activityLogMessages.length })
}

export const fetchActivityLogsNext = () => async (dispatch, getState) => {
  const state = getState()
  const activityLogState = ActivityLogState.getState(state)
  const offsetOld = ActivityLogState.getOffset(activityLogState)
  const limit = ActivityLogState.getLimit(activityLogState)
  const offset = offsetOld + limit
  const activityLogMessages = await _fetchActivityLogs(state, offset, limit)
  const loadComplete = R.any(message => ActivityLogMessage.getType(message) === ActivityLog.type.surveyCreate, activityLogMessages)

  activityLogMessages && (await dispatch({ type: homeActivityMessagesUpdate, activityLogMessages, offset, limit, loadComplete }))
}

export const resetActivityLogs = () => dispatch => dispatch({ type: homeActivityMessagesReset })