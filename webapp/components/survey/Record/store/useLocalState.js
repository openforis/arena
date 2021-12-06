import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'

import * as AppWebSocket from '@webapp/app/appWebSocket'
import { RecordActions, RecordState } from '@webapp/store/ui/record'
import { useSurveyInfo, useSurveyCycleKey } from '@webapp/store/survey'
import { useAuthCanEditRecord } from '@webapp/store/user'

import { useOnUpdate, useQuery } from '@webapp/components/hooks'

import { State } from './state'

export const useLocalState = (props) => {
  const { recordUuid: recordUuidProp, pageNodeUuid: pageNodeUuidProp, pageNodeDefUuid: pageNodeDefUuidProp } = props
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { recordUuid: recordUuidUrlParam } = useParams()

  const { pageNodeUuid: pageNodeUuidUrlParam, pageNodeDefUuid: pageNodeDefUuidUrlParam } = useQuery()

  const recordUuidPreview = useSelector(RecordState.getRecordUuidPreview)
  const preview = Boolean(recordUuidPreview)

  const recordUuid = recordUuidProp || recordUuidUrlParam || recordUuidPreview
  const pageNodeUuid = pageNodeUuidProp || pageNodeUuidUrlParam
  const pageNodeDefUuid = pageNodeDefUuidProp || pageNodeDefUuidUrlParam

  const surveyInfo = useSurveyInfo()
  const surveyCycleKey = useSurveyCycleKey()

  const record = useSelector(RecordState.getRecord)
  const editable = useAuthCanEditRecord(record)

  const [state, setState] = useState(() => State.create({ preview }))
  const loadedRef = useRef(false)

  if (record && !State.isLoaded(state)) {
    loadedRef.current = true
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

    if (loadedRef.current) {
      dispatch(RecordActions.checkOutRecord(recordUuid))
    }

    // Remove beforeunload event listener
    window.removeEventListener('beforeunload', componentUnload)
  }

  const componentLoad = () => {
    // Check in record
    // when previewing a survey or when the survey has been imported from Collect and not published,
    // record must be checked in as draft
    const draft = preview || !Survey.isPublished(surveyInfo)
    dispatch(RecordActions.checkInRecord(recordUuid, draft, pageNodeUuid, pageNodeDefUuid))

    // Add websocket event listeners
    AppWebSocket.on(WebSocketEvents.nodesUpdate, (content) => dispatch(RecordActions.recordNodesUpdate(content)))
    AppWebSocket.on(WebSocketEvents.nodeValidationsUpdate, (content) =>
      dispatch(RecordActions.nodeValidationsUpdate(content))
    )
    AppWebSocket.on(WebSocketEvents.nodesUpdateCompleted, (content) =>
      dispatch(RecordActions.nodesUpdateCompleted(content))
    )
    AppWebSocket.on(WebSocketEvents.recordDelete, () => dispatch(RecordActions.recordDeleted(navigate)))
    AppWebSocket.on(WebSocketEvents.recordSessionExpired, () => dispatch(RecordActions.sessionExpired(navigate)))
    AppWebSocket.on(WebSocketEvents.applicationError, ({ key, params }) =>
      dispatch(RecordActions.applicationError(navigate, key, params))
    )

    // Add beforeunload event listener
    window.addEventListener('beforeunload', componentUnload)
  }

  useEffect(() => {
    componentLoad()
    return componentUnload
  }, [])

  useOnUpdate(() => {
    dispatch(RecordActions.cycleChanged(navigate))
  }, [surveyCycleKey])

  return { state }
}
