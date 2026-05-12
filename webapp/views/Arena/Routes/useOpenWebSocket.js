import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import * as User from '@core/user/user'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import * as AppWebSocket from '@webapp/app/appWebSocket'

import { SystemErrorActions } from '@webapp/store/system'
import { JobActions } from '@webapp/store/app'
import { DialogConfirmActions } from '@webapp/store/ui'

import { useUser } from '@webapp/store/user'

export const useOpenWebSocket = () => {
  const dispatch = useDispatch()
  const user = useUser()
  const userUuid = User.getUuid(user)

  const onJobUpdate = useCallback((job) => dispatch(JobActions.updateJob({ job })), [dispatch])
  const onUserRoleUpdate = useCallback(
    () =>
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'usersView:userRoleUpdatedRefreshRequired',
          okButtonLabel: 'common.refresh',
          dismissable: false,
          onOk: () => {
            globalThis.location.reload()
          },
        })
      ),
    [dispatch]
  )

  const openSocket = useCallback(async () => {
    await AppWebSocket.openSocket((error) => dispatch(SystemErrorActions.throwSystemError({ error })))
    AppWebSocket.on(WebSocketEvents.jobUpdate, onJobUpdate)
    AppWebSocket.on(WebSocketEvents.userRoleUpdate, onUserRoleUpdate)
  }, [dispatch, onJobUpdate, onUserRoleUpdate])

  const closeSocket = useCallback(() => {
    AppWebSocket.closeSocket()
    AppWebSocket.off(WebSocketEvents.jobUpdate, onJobUpdate)
    AppWebSocket.off(WebSocketEvents.userRoleUpdate, onUserRoleUpdate)
  }, [onJobUpdate, onUserRoleUpdate])

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
