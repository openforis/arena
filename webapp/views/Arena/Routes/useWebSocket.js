import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import * as User from '@core/user/user'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import * as AppWebSocket from '@webapp/app/appWebSocket'

import { SystemErrorActions } from '@webapp/store/system'
import { JobActions } from '@webapp/store/app'

import { useUser } from '@webapp/store/user'

export const useWebSocket = () => {
  const dispatch = useDispatch()
  const user = useUser()

  const onJobUpdate = useCallback((job) => dispatch(JobActions.updateJob({ job })), [])

  const openSocket = () => {
    ;(async () => {
      await AppWebSocket.openSocket((error) => dispatch(SystemErrorActions.throwSystemError({ error })))
      AppWebSocket.on(WebSocketEvents.jobUpdate, onJobUpdate)
    })()
  }

  const closeSocket = () => {
    AppWebSocket.closeSocket()
    AppWebSocket.off(WebSocketEvents.jobUpdate, onJobUpdate)
  }

  useEffect(() => {
    console.log('UNMOUNT')
    return closeSocket
  }, [])

  useEffect(() => {
    if (user) {
      openSocket()
    } else {
      console.log('NO USER')
      closeSocket()
    }
  }, [User.getUuid(user)])
}
