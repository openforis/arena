import * as R from 'ramda'

import { useEffect, useRef, useState } from 'react'

import * as A from '@core/arena'

import { useInterval } from '@webapp/components/hooks'

import * as API from '@webapp/service/api'

import { useSurvey, useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import * as ActivityLogMessage from '../activityLogMessage'
import * as ActivityLogMessageParser from '../parsers'

export const useFetchMessages = ({ messages, setMessages }) => {
  const i18n = useI18n()
  const survey = useSurvey()
  const surveyId = useSurveyId()
  const [data, setData] = useState([])
  const cancelRequestRef = useRef(null)

  useEffect(() => {
    setMessages(data || [])
    return () => {
      if (cancelRequestRef.current) {
        cancelRequestRef.current()
      }
    }
  }, [data])

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

      const { request, cancel } = API.fetchActivityLogs({ surveyId, params })
      cancelRequestRef.current = cancel

      request
        .then(({ data: { activityLogs } }) => {
          if (A.isEmpty(activityLogs)) {
            return null
          }

          const highlighted = newest && initialized

          const messagesNew = R.map(ActivityLogMessageParser.toMessage(i18n, survey, highlighted))(activityLogs)
          const messagesOld = R.map(ActivityLogMessage.dissocHighlighted, messages)
          const newMessages = newest ? R.concat(messagesNew, messagesOld) : R.concat(messagesOld, messagesNew)
          if (newMessages) {
            setData(newMessages)
          }
          return newMessages
        })
        .catch(() => {
          // canceled
        })
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
