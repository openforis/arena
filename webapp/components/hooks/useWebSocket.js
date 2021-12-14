import { useEffect } from 'react'

import * as AppWebSocket from '@webapp/app/appWebSocket'

export const useWebSocket = ({ eventName, eventHandler }) => {
  useEffect(() => {
    AppWebSocket.on(eventName, eventHandler)

    return () => {
      AppWebSocket.off(eventName, eventHandler)
    }
  }, [eventName, eventHandler])
}
