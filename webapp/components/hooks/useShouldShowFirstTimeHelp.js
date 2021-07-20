import { useState, useEffect } from 'react'

import * as ActivityLogObject from '@common/activityLog/activityLog'
import * as Survey from '@core/survey/survey'

const hasActivityOfType = ({messages, type}) => messages.some((message) => (type === message.type))

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
      if (hasActivityOfType({ messages, type: ActivityLogObject.type.nodeDefCreate})) {
        return
      }
      _help = ActivityLogObject.type.nodeDefCreate

      if (hasActivityOfType({ messages, type: ActivityLogObject.type.surveyPropUpdate})) {
        setHelp(_help)
        return
      }
      _help = ActivityLogObject.type.surveyPropUpdate
      setHelp(_help)
    }
  }, [messages])

  return help
}
