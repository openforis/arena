import { useState, useEffect } from 'react'

import * as ActivityLogObject from '@common/activityLog/activityLog'
import * as Survey from '@core/survey/survey'
import { useSurveyInfo } from '@webapp/store/survey'

const hasActivityOfType = ({messages, activityType}) => messages.some((message) => (activityType === message.type))

export const useShouldShowFirstTimeHelp = ({ useFetchMessages, helperTypes }) => {
  const surveyInfo = useSurveyInfo()
  const [messages, setMessages] = useState([])
  const [help, setHelp] = useState(false)

  const fetchMessages = useFetchMessages({ messages, setMessages })

  useEffect(() => {
    if(Survey.getUuid(surveyInfo))
    fetchMessages({ newest: true })
  }, [surveyInfo])

  useEffect(() => {
    if (messages.length > 0 && messages.length < 10) {
      let _help = false

      if (hasActivityOfType({ messages, activityType: ActivityLogObject.type.nodeDefCreate})) {
        setHelp(_help)
        return
      }
      _help = helperTypes.surveyWithoutNodeDefs

      if (hasActivityOfType({ messages, activityType: ActivityLogObject.type.surveyPropUpdate})) {
        setHelp(_help)
        return
      }
      _help = helperTypes.firstTimeSurvey

      setHelp(_help)
    }
  }, [messages])

  return help
}
