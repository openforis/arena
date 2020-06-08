import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import * as User from '@core/user/user'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import * as AppWebSocket from '@webapp/app/appWebSocket'

import { useUser } from '@webapp/components/hooks'

import { throwSystemError } from '@webapp/app/actions'
import { activeJobUpdate } from '@webapp/loggedin/appJob/actions'

export const useWebSocket = () => {
  const dispatch = useDispatch()
  const user = useUser()

  const openSocket = () => {
    ;(async () => {
      await AppWebSocket.openSocket((error) => dispatch(throwSystemError(error)))
      AppWebSocket.on(WebSocketEvents.jobUpdate, (job) => dispatch(activeJobUpdate(job)))
    })()
  }

  const closeSocket = () => {
    AppWebSocket.closeSocket()
    AppWebSocket.off(WebSocketEvents.jobUpdate)
  }

  useEffect(() => {
    return closeSocket
  }, [])

  useEffect(() => {
    if (user) {
      openSocket()
    } else {
      closeSocket()
    }
  }, [User.getUuid(user)])
}
