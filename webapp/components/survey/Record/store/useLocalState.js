import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useHistory } from 'react-router'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'

import * as AppWebSocket from '@webapp/app/appWebSocket'
import { RecordActions, RecordState } from '@webapp/store/ui/record'
import { useSurveyInfo, useSurveyCycleKey } from '@webapp/store/survey'
import { SurveyFormActions } from '@webapp/store/ui/surveyForm'
import { useAuthCanEditRecord } from '@webapp/store/user'

import { useOnUpdate } from '@webapp/components/hooks'

import { State } from './state'

export const useLocalState = () => {
  const history = useHistory()
  const dispatch = useDispatch()

  const {
    recordUuid: recordUuidUrlParam,
    pageNodeUuid: pageNodeUuidUrlParam,
    pageNodeDefUuid: pageNodeDefUuidUrlParam,
  } = useParams()

  const recordUuidPreview = useSelector(RecordState.getRecordUuidPreview)
  const preview = Boolean(recordUuidPreview)

  const recordUuid = recordUuidUrlParam || recordUuidPreview

  const surveyInfo = useSurveyInfo()
  const surveyCycleKey = useSurveyCycleKey()

  const record = useSelector(RecordState.getRecord)
  const editable = useAuthCanEditRecord(record) && (Survey.isPublished(surveyInfo) || Record.isPreview(record))

  const [state, setState] = useState(() => State.create({ preview }))

  if (record && !State.isLoaded(state)) {
    setState(A.pipe(State.assocLoaded(true), State.assocEditable(editable)))
  }

  const componentUnload = () => {
    // Remove web socket listeners
    AppWebSocket.off(WebSocketEvents.nodesUpdate)
    AppWebSocket.off(WebSocketEvents.nodeValidationsUpdate)
    AppWebSocket.off(WebSocketEvents.nodesUpdateCompleted)
    AppWebSocket.off(WebSocketEvents.recordDelete)
    AppWebSocket.off(WebSocketEvents.recordSessionExpired)
    AppWebSocket.off(WebSocketEvents.applicationError)

    if (State.isLoaded(state)) {
      dispatch(RecordActions.checkOutRecord(recordUuid))
    }

    // Reset form
    dispatch(SurveyFormActions.resetForm())

    // Remove beforeunload event listener
    window.removeEventListener('beforeunload', componentUnload)
  }

  const componentLoad = () => {
    // Check in record
    dispatch(RecordActions.checkInRecord(recordUuid, preview, pageNodeUuidUrlParam, pageNodeDefUuidUrlParam))

    // Add websocket event listeners
    AppWebSocket.on(WebSocketEvents.nodesUpdate, (content) => dispatch(RecordActions.recordNodesUpdate(content)))
    AppWebSocket.on(WebSocketEvents.nodeValidationsUpdate, (content) =>
      dispatch(RecordActions.nodeValidationsUpdate(content))
    )
    AppWebSocket.on(WebSocketEvents.nodesUpdateCompleted, (content) =>
      dispatch(RecordActions.nodesUpdateCompleted(content))
    )
    AppWebSocket.on(WebSocketEvents.recordDelete, () => dispatch(RecordActions.recordDeleted(history)))
    AppWebSocket.on(WebSocketEvents.recordSessionExpired, () => dispatch(RecordActions.sessionExpired(history)))
    AppWebSocket.on(WebSocketEvents.applicationError, ({ key, params }) =>
      dispatch(RecordActions.applicationError(history, key, params))
    )

    // Add beforeunload event listener
    window.addEventListener('beforeunload', componentUnload)
  }

  useEffect(() => {
    componentLoad()
    return componentUnload
  }, [])

  useOnUpdate(() => {
    dispatch(RecordActions.cycleChanged(history))
  }, [surveyCycleKey])

  return { state }
}
