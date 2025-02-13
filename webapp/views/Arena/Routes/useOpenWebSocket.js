import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import * as User from '@core/user/user'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import * as AppWebSocket from '@webapp/app/appWebSocket'

import { SystemErrorActions } from '@webapp/store/system'
import { JobActions, JobsQueueActions } from '@webapp/store/app'

import { useUser } from '@webapp/store/user'

const jobQueueUpdateEvent = 'jobQueue/jobUpdate'

export const useOpenWebSocket = () => {
  const dispatch = useDispatch()
  const user = useUser()
  const userUuid = User.getUuid(user)

  const onJobUpdate = useCallback((job) => dispatch(JobActions.updateJob({ job })), [dispatch])
  const onJobQueueUpdate = useCallback((jobInfo) => dispatch(JobsQueueActions.updateJob({ jobInfo })), [dispatch])

  const openSocket = useCallback(async () => {
    await AppWebSocket.openSocket((error) => dispatch(SystemErrorActions.throwSystemError({ error })))
    AppWebSocket.on(WebSocketEvents.jobUpdate, onJobUpdate)
    AppWebSocket.on(jobQueueUpdateEvent, onJobQueueUpdate)
  }, [dispatch, onJobQueueUpdate, onJobUpdate])

  const closeSocket = useCallback(() => {
    AppWebSocket.closeSocket()
    AppWebSocket.off(WebSocketEvents.jobUpdate, onJobUpdate)
    AppWebSocket.off(jobQueueUpdateEvent, onJobQueueUpdate)
  }, [onJobQueueUpdate, onJobUpdate])

  useEffect(() => {
    if (userUuid) {
      openSocket()
    } else {
      closeSocket()
    }
    return () => closeSocket()
  }, [closeSocket, openSocket, userUuid])
}
