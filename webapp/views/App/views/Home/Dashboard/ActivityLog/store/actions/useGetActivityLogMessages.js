import axios from 'axios'
import * as R from 'ramda'

import { useInterval } from '@webapp/components/hooks'

import { useSurvey, useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import * as ActivityLogMessage from '../activityLogMessage'
import * as ActivityLogMessageParser from '../parsers'

export const useFetchMessages = () => {
  const i18n = useI18n()
  const survey = useSurvey()
  const surveyId = useSurveyId()

  return ({ newest, messages, setMessages }) => {
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

      if (R.isEmpty(activityLogs)) {
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
  const fetchMessages = useFetchMessages()

  useInterval(() => fetchMessages({ newest: true, messages, setMessages }), 3000, [messages])

  return () => {
    ;(async () => {
      await fetchMessages({ newest: true, messages, setMessages })
    })()
  }
}

export const useGetActivityLogMessagesNext = ({ messages, setMessages }) => {
  const fetchMessages = useFetchMessages()
  return () => {
    ;(async () => {
      await fetchMessages({ newest: false, messages, setMessages })
    })()
  }
}
