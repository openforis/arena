import axios from 'axios'
import * as R from 'ramda'
import { useEffect, useState } from 'react'

import { useSurvey, useSurveyId } from '@webapp/store/survey'

import { useI18n } from '@webapp/store/system'

import * as ActivityLogMessage from '../ActivityLogMessage'
import * as ActivityLogMessageParser from '../parsers'

export const useGetActivityLogMessages = ({ messages, setMessages }) => {
  const i18n = useI18n()
  const survey = useSurvey()
  const surveyId = useSurveyId()

  const [newest, setNewest] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const fetchMessages = async () => {
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

    const highlighted = newest && initialized
    const messagesNew = R.map(ActivityLogMessageParser.toMessage(i18n, survey, highlighted))(activityLogs)
    const messagesOld = R.map(ActivityLogMessage.dissocHighlighted, messages)
    const newMessages = newest ? R.concat(messagesNew, messagesOld) : R.concat(messagesOld, messagesNew)
    if (newMessages) {
      setMessages(newMessages)
    }
    return newMessages
  }

  useEffect(() => {
    const timer = window.setInterval(async () => {
      await fetchMessages()
    }, 3000)
    return () => {
      window.clearInterval(timer)
    }
  }, [newest, initialized])

  return () => {
    ;(async () => {
      await fetchMessages()
      if (!newest) setNewest(true)
      if (!initialized) setInitialized(true)
    })()
  }
}
