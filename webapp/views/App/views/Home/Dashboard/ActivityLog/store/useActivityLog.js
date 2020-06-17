import { useState, useEffect } from 'react'

import { useActions } from './actions'

export const useActivityLog = () => {
  const [messages, setMessages] = useState([])

  const { onGetActivityLogMessages } = useActions({
    messages,
    setMessages,
  })

  useEffect(() => {
    onGetActivityLogMessages()
  }, [])

  return {
    messages,
  }
}
