import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

import * as User from '@core/user/user'

import * as AppWebSocket from '@webapp/app/appWebSocket'
import { JobActions } from '@webapp/store/app'
import { SystemErrorActions } from '@webapp/store/system'
import { useUser } from '@webapp/store/user'

export const useOpenWebSocket = () => {
  const dispatch = useDispatch()
  const user = useUser()
  const userUuid = User.getUuid(user)

  const onJobUpdate = useCallback((job) => dispatch(JobActions.updateJob({ job })), [])

  const openSocket = useCallback(async () => {
    await AppWebSocket.openSocket((error) => dispatch(SystemErrorActions.throwSystemError({ error })))
    AppWebSocket.on(WebSocketEvents.jobUpdate, onJobUpdate)
  }, [onJobUpdate])

  const closeSocket = useCallback(() => {
    AppWebSocket.closeSocket()
    AppWebSocket.off(WebSocketEvents.jobUpdate, onJobUpdate)
  }, [onJobUpdate])

  useEffect(() => {
    return () => closeSocket()
  }, [closeSocket])

  useEffect(() => {
    if (userUuid) {
      openSocket()
    } else {
      closeSocket()
    }
  }, [closeSocket, openSocket, userUuid])
}
