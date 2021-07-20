import { useState, useEffect } from 'react'

import * as ActivityLogObject from '@common/activityLog/activityLog'
import * as Survey from '@core/survey/survey'

export const useShouldShowFirstTimeHelp = ({ useFetchMessages, surveyInfo }) => {
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
      if (messages.some((message) => [ActivityLogObject.type.nodeDefCreate].includes(message.type))) {
        return
      }
      _help = ActivityLogObject.type.nodeDefCreate

      if (messages.some((message) => [ActivityLogObject.type.surveyPropUpdate].includes(message.type))) {
        setHelp(_help)
        return
      }
      _help = ActivityLogObject.type.surveyPropUpdate
      setHelp(_help)
    }
  }, [messages])

  return help
}
