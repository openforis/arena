import { useCallback, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import * as User from '@core/user/user'
import * as JobSerialized from '@common/job/jobSerialized'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import * as AppWebSocket from '@webapp/app/appWebSocket'
import { appModuleUri, homeModules } from '@webapp/app/appModules'
import { fetchJob } from '@webapp/service/api'

import { SystemErrorActions } from '@webapp/store/system'
import { JobActions, useJob } from '@webapp/store/app'
import { DialogConfirmActions } from '@webapp/store/ui'

import { useUser } from '@webapp/store/user'
import { useSurveyId } from '@webapp/store/survey'

export const useOpenWebSocket = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)
  const user = useUser()
  const userUuid = User.getUuid(user)
  const surveyIdCurrent = useSurveyId()
  const { job } = useJob()
  const jobRef = useRef(job)

  useEffect(() => {
    navigateRef.current = navigate
  }, [navigate])

  useEffect(() => {
    jobRef.current = job
  }, [job])

  const onJobUpdate = useCallback((job) => dispatch(JobActions.updateJob({ job })), [dispatch])

  // The job monitor only ever updates from pushed jobUpdate events; a job that ends (e.g. gets
  // orphaned and failed server-side) while this client is disconnected leaves the dialog frozen
  // forever, since nothing re-syncs on reconnect otherwise. Re-fetch the job currently shown as
  // soon as the socket (re)connects, so a stale "running" dialog resolves to its real status.
  const onSocketConnect = useCallback(async () => {
    const currentJob = jobRef.current
    if (!currentJob || JobSerialized.isEnded(currentJob)) return

    try {
      const updatedJob = await fetchJob(JobSerialized.getUuid(currentJob))
      if (updatedJob) {
        dispatch(JobActions.updateJob({ job: updatedJob }))
      }
    } catch {
      // best-effort resync; leave the dialog as-is and let the next reconnect try again
    }
  }, [dispatch])
  const onUserRoleUpdate = useCallback(
    ({ surveyId } = {}) => {
      if (String(surveyId) !== String(surveyIdCurrent)) {
        return
      }
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'usersView:userRoleUpdatedRefreshRequired',
          okButtonLabel: 'common.refresh',
          dismissable: false,
          onOk: () => {
            globalThis.location.reload()
          },
        })
      )
    },
    [dispatch, surveyIdCurrent]
  )
  const onUserRemovedFromSurvey = useCallback(
    ({ surveyId } = {}) => {
      if (String(surveyId) !== String(surveyIdCurrent)) {
        return
      }
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'usersView:userRemovedFromSurveyGoToSurveysRequired',
          okButtonLabel: 'common.goToSurveys',
          dismissable: false,
          onOk: () => {
            navigateRef.current(appModuleUri(homeModules.surveyList))
          },
        })
      )
    },
    [dispatch, surveyIdCurrent]
  )

  const openSocket = useCallback(async () => {
    await AppWebSocket.openSocket((error) => dispatch(SystemErrorActions.throwSystemError({ error })))
    AppWebSocket.on(WebSocketEvents.jobUpdate, onJobUpdate)
    AppWebSocket.on(WebSocketEvents.connect, onSocketConnect)
    AppWebSocket.on(WebSocketEvents.userRoleUpdate, onUserRoleUpdate)
    AppWebSocket.on(WebSocketEvents.userRemovedFromSurvey, onUserRemovedFromSurvey)
  }, [dispatch, onJobUpdate, onSocketConnect, onUserRoleUpdate, onUserRemovedFromSurvey])

  const closeSocket = useCallback(() => {
    AppWebSocket.closeSocket()
    AppWebSocket.off(WebSocketEvents.jobUpdate, onJobUpdate)
    AppWebSocket.off(WebSocketEvents.connect, onSocketConnect)
    AppWebSocket.off(WebSocketEvents.userRoleUpdate, onUserRoleUpdate)
    AppWebSocket.off(WebSocketEvents.userRemovedFromSurvey, onUserRemovedFromSurvey)
  }, [onJobUpdate, onSocketConnect, onUserRoleUpdate, onUserRemovedFromSurvey])

  useEffect(() => {
    return () => {
      closeSocket()
    }
  }, [closeSocket])

  useEffect(() => {
    if (userUuid) {
      openSocket()
    } else {
      closeSocket()
    }
  }, [closeSocket, openSocket, userUuid])
}
