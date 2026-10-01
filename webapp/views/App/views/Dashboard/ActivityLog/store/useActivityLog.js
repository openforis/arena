import { useState, useEffect } from 'react'

import { useActions } from './actions'

export const useActivityLog = () => {
  const [messages, setMessages] = useState([])
  const [hasError, setHasError] = useState(false)

  const { onGetActivityLogMessages, onGetActivityLogMessagesNext } = useActions({
    messages,
    setMessages,
    onError: () => setHasError(true),
  })

  useEffect(() => {
    onGetActivityLogMessages()
  }, [])

  return {
    messages,
    hasError,
    onGetActivityLogMessagesNext,
  }
}
