import axios from 'axios'
import * as R from 'ramda'

import * as A from '@core/arena'

import { useInterval } from '@webapp/components/hooks'

import { useSurvey, useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import * as ActivityLogMessage from '../activityLogMessage'
import * as ActivityLogMessageParser from '../parsers'

export const useFetchMessages = ({ messages, setMessages }) => {
  const i18n = useI18n()
  const survey = useSurvey()
  const surveyId = useSurveyId()

  return ({ newest }) => {
    ;(async () => {
      const params = {}
      const initialized = messages.length > 0

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

      if (A.isEmpty(activityLogs)) {
        return null
      }

      const highlighted = newest && initialized

      const messagesNew = R.map(ActivityLogMessageParser.toMessage(i18n, survey, highlighted))(activityLogs)
      const messagesOld = R.map(ActivityLogMessage.dissocHighlighted, messages)
      const newMessages = newest ? R.concat(messagesNew, messagesOld) : R.concat(messagesOld, messagesNew)
      if (newMessages) {
        setMessages(newMessages)
      }
      return newMessages
    })()
  }
}

export const useGetActivityLogMessages = ({ messages, setMessages }) => {
  const fetchMessages = useFetchMessages({ messages, setMessages })

  useInterval(() => messages.length > 0 && fetchMessages({ newest: true }), 3000)

  return () => {
    ;(async () => fetchMessages({ newest: true }))()
  }
}

export const useGetActivityLogMessagesNext = ({ messages, setMessages }) => {
  const fetchMessages = useFetchMessages({ messages, setMessages })
  return () => {
    ;(async () => fetchMessages({ newest: false }))()
  }
}
