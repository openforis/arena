import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import * as User from '@core/user/user'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import * as AppWebSocket from '@webapp/app/appWebSocket'
import { appModuleUri, homeModules } from '@webapp/app/appModules'

import { SystemErrorActions } from '@webapp/store/system'
import { JobActions } from '@webapp/store/app'
import { DialogConfirmActions } from '@webapp/store/ui'

import { useUser } from '@webapp/store/user'

export const useOpenWebSocket = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
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
  const onUserRemovedFromSurvey = useCallback(
    () =>
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'usersView:userRemovedFromSurveyGoToSurveysRequired',
          okButtonLabel: 'common.goToSurveys',
          dismissable: false,
          onOk: () => {
            navigate(appModuleUri(homeModules.surveyList))
          },
        })
      ),
    [dispatch, navigate]
  )

  const openSocket = useCallback(async () => {
    await AppWebSocket.openSocket((error) => dispatch(SystemErrorActions.throwSystemError({ error })))
    AppWebSocket.on(WebSocketEvents.jobUpdate, onJobUpdate)
    AppWebSocket.on(WebSocketEvents.userRoleUpdate, onUserRoleUpdate)
    AppWebSocket.on(WebSocketEvents.userRemovedFromSurvey, onUserRemovedFromSurvey)
  }, [dispatch, onJobUpdate, onUserRoleUpdate, onUserRemovedFromSurvey])

  const closeSocket = useCallback(() => {
    AppWebSocket.closeSocket()
    AppWebSocket.off(WebSocketEvents.jobUpdate, onJobUpdate)
    AppWebSocket.off(WebSocketEvents.userRoleUpdate, onUserRoleUpdate)
    AppWebSocket.off(WebSocketEvents.userRemovedFromSurvey, onUserRemovedFromSurvey)
  }, [onJobUpdate, onUserRoleUpdate, onUserRemovedFromSurvey])

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
