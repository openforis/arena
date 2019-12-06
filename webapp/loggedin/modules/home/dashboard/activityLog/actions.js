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

const fetchActivityLogs = async (state, offset = 0, limit = 30) => {
  try {
    const activityLogMessagesState = ActivityLogState.getMessages(state)
    const survey = SurveyState.getSurvey(state)
    const surveyId = Survey.getId(survey)
    const i18n = AppState.getI18n(state)

    const {
      data: { activityLogs },
    } = await axios.get(`/api/survey/${surveyId}/activity-log`, { params: { offset, limit } })

    // Add new messages to messages already in state and sort them by creation date in reverse order
    // Highlight new messages when fetching newest ones
    const highlighted = !R.isEmpty(activityLogMessagesState) && offset === 0
    const activityLogMessagesNew = R.pipe(
      // Exclude activities already loaded
      R.reject(activity =>
        R.includes(ActivityLog.getId(activity), R.pluck(ActivityLogMessage.keys.id, activityLogMessagesState)),
      ),
      // Parse ActivityLog into ActivityLogMessage
      R.map(ActivityLogMessageParser.toMessage(i18n, survey, highlighted)),
    )(activityLogs)

    // If there aren't any new messages, return null, otherwise merge the new messages with the old ones
    return R.ifElse(
      R.isEmpty,
      R.always(null),
      R.pipe(
        // Append new messages to old ones
        R.concat(R.map(ActivityLogMessage.dissocHighlighted, activityLogMessagesState)),
        // Sort by id in reverse order
        R.sortBy(R.compose(R.negate, Number, ActivityLogMessage.getId)),
      ),
    )(activityLogMessagesNew)
  } catch (error) {
    console.log(error)
  }
}

export const fetchActivityLogsNewest = () => async (dispatch, getState) => {
  const activityLogMessages = await fetchActivityLogs(getState())
  if (activityLogMessages)
    await dispatch({
      type: homeActivityMessagesUpdate,
      activityLogMessages,
      offset: 0,
      limit: activityLogMessages.length,
    })
}

export const fetchActivityLogsNext = () => async (dispatch, getState) => {
  const state = getState()
  const offsetOld = ActivityLogState.getOffset(state)
  const limit = ActivityLogState.getLimit(state)
  const offset = offsetOld + limit
  const activityLogMessages = await fetchActivityLogs(state, offset, limit)

  // When the activity of type "surveyCreate" is loaded, activity logs load is complete
  const loadComplete = R.any(
    message => ActivityLogMessage.getType(message) === ActivityLog.type.surveyCreate,
    activityLogMessages,
  )

  if (activityLogMessages)
    await dispatch({ type: homeActivityMessagesUpdate, activityLogMessages, offset, limit, loadComplete })
}

export const resetActivityLogs = () => dispatch => dispatch({ type: homeActivityMessagesReset })
