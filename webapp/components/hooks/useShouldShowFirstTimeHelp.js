import { useState, useEffect } from 'react'

import * as ActivityLogObject from '@common/activityLog/activityLog'
import * as Survey from '@core/survey/survey'
import { useSurveyInfo } from '@webapp/store/survey'

const hasActivityOfType = ({ messages, activityType }) => messages.some((message) => activityType === message.type)

const determineHelperType = ({ messages, helperTypes }) => {
  if (hasActivityOfType({ messages, activityType: ActivityLogObject.type.nodeDefCreate })) {
    return false
  }
  if (hasActivityOfType({ messages, activityType: ActivityLogObject.type.surveyPropUpdate })) {
    return helperTypes.surveyWithoutNodeDefs
  }
  return helperTypes.firstTimeSurvey
}


export const useShouldShowFirstTimeHelp = ({ useFetchMessages, helperTypes }) => {
  const surveyInfo = useSurveyInfo()
  const [messages, setMessages] = useState([])
  const [help, setHelp] = useState(false)

  const fetchMessages = useFetchMessages({ messages, setMessages })

  useEffect(() => {
    if (Survey.getUuid(surveyInfo) && !Survey.isFromCollect(surveyInfo) && !Survey.isTemplate(surveyInfo)) {
      fetchMessages()
    }
  }, [surveyInfo])

  useEffect(() => {
    if (messages.length > 0 && messages.length < 10) {

      const helperType = determineHelperType({ messages, helperTypes })
      setHelp(helperType)

    }
  }, [messages])

  return help
}
