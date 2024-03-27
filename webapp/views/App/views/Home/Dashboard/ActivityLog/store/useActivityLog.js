import { useEffect, useState } from 'react'

import { useActions } from './actions'

export const useActivityLog = () => {
  const [messages, setMessages] = useState([])
  const [visible, setVisible] = useState(false)

  const { onGetActivityLogMessages, onGetActivityLogMessagesNext } = useActions({
    messages,
    setMessages,
  })

  useEffect(() => {
    if (visible) {
      onGetActivityLogMessages()
    }
    setMessages([])
  }, [visible])

  return {
    messages,
    onGetActivityLogMessagesNext,
    visible,
    setVisible,
  }
}
