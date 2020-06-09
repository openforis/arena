import axios from 'axios'
import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as Survey from '@core/survey/survey'

import { SurveyState } from '@webapp/store/survey'
import { I18nState } from '@webapp/store/system'
import * as ActivityLogState from '@webapp/loggedin/modules/home/dashboard/activityLog/activityLogState'

import * as ActivityLogMessage from './activityLogMessage'
import * as ActivityLogMessageParser from './activityLogMessageParser'

export const homeActivityMessagesUpdate = 'home/activityLog/messages/update'
export const homeActivityMessagesReset = 'home/activityLog/messages/reset'

const fetchActivityLogs = async (state, newest = true) => {
  const i18n = I18nState.getI18n(state)
  const messages = ActivityLogState.getMessages(state)
  const initialized = ActivityLogState.isInitialized(state)
  const survey = SurveyState.getSurvey(state)
  const surveyId = Survey.getId(survey)

  const params = {}
  if (initialized) {
    if (newest) {
      params.idGreaterThan = R.pipe(R.head, ActivityLogMessage.getId)(messages)
    } else {
      params.idLessThan = R.pipe(R.last, ActivityLogMessage.getId)(messages)
    }
  }

  const {
    data: { activityLogs },
  } = await axios.get(`/api/survey/${surveyId}/activity-log`, { params })

  if (R.isEmpty(activityLogs)) {
    return null
  }
  // Add new messages to messages already in state
  // Highlight new messages when fetching newest ones
  const highlighted = newest && initialized
  const messagesNew = R.map(ActivityLogMessageParser.toMessage(i18n, survey, highlighted))(activityLogs)
  const messagesOld = R.map(ActivityLogMessage.dissocHighlighted, messages)
  return newest ? R.concat(messagesNew, messagesOld) : R.concat(messagesOld, messagesNew)
}

export const fetchActivityLogsNewest = () => async (dispatch, getState) => {
  const messages = await fetchActivityLogs(getState())
  if (messages)
    await dispatch({
      type: homeActivityMessagesUpdate,
      messages,
    })
}

export const fetchActivityLogsNext = () => async (dispatch, getState) => {
  const messages = await fetchActivityLogs(getState(), false)
  if (messages) {
    // When the activity of type "surveyCreate" is loaded, activity logs load is complete
    const loadComplete = R.any(R.pipe(ActivityLogMessage.getType, R.equals(ActivityLog.type.surveyCreate)), messages)
    await dispatch({ type: homeActivityMessagesUpdate, messages, loadComplete })
  }
}

export const resetActivityLogs = () => (dispatch) => dispatch({ type: homeActivityMessagesReset })
