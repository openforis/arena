import { useState, useEffect } from 'react'

import * as ActivityLogObject from '@common/activityLog/activityLog'
import * as Survey from '@core/survey/survey'
import { useSurvey } from '@webapp/store/survey'

const hasActivityOfType = ({ messages, activityType }) => messages.some((message) => activityType === message.type)

const determineHelperType = ({ numberOfNodeDefs, messages, helperTypes }) => {
  if (numberOfNodeDefs > 1) {
    return false
  }
  if (hasActivityOfType({ messages, activityType: ActivityLogObject.type.surveyPropUpdate })) {
    return helperTypes.surveyWithoutNodeDefs
  }
  return helperTypes.firstTimeSurvey
}

export const useShouldShowFirstTimeHelp = ({ useFetchMessages, helperTypes }) => {
  const survey = useSurvey()
  const surveyInfo = Survey.getSurveyInfo(survey)
  const numberOfNodeDefs = Survey.getNodeDefsArray(survey).length
  const [messages, setMessages] = useState([])
  const [help, setHelp] = useState(false)

  const fetchMessages = useFetchMessages({ messages, setMessages })

  useEffect(() => {
    if (
      Survey.getUuid(surveyInfo) &&
      !Survey.isPublished(surveyInfo) &&
      !Survey.isFromCollect(surveyInfo) &&
      !Survey.isTemplate(surveyInfo)
    ) {
      fetchMessages()
    }
  }, [surveyInfo])

  useEffect(() => {
    if (
      numberOfNodeDefs === 1 && // only root entity def
      messages.length > 0 &&
      messages.length < 10
    ) {
      const helperType = determineHelperType({ survey, messages, helperTypes })
      setHelp(helperType)
    }
  }, [numberOfNodeDefs, messages])

  return help
}
