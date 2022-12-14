import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'

import { RecordActions, RecordState } from '@webapp/store/ui/record'
import { useSurveyInfo, useSurveyCycleKey } from '@webapp/store/survey'
import { useAuthCanEditRecord } from '@webapp/store/user'

import { useOnUpdate, useQuery, useOnWebSocketEvent } from '@webapp/components/hooks'

import { State } from './state'

export const useLocalState = (props) => {
  const {
    recordUuid: recordUuidProp,
    pageNodeUuid: pageNodeUuidProp,
    pageNodeDefUuid: pageNodeDefUuidProp,
    insideMap = false,
  } = props
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
    if (loadedRef.current) {
      dispatch(RecordActions.checkOutRecord(recordUuid))
    }

    // Remove beforeunload event listener
    window.removeEventListener('beforeunload', componentUnload)
  }

  // Add websocket event listeners
  useOnWebSocketEvent({
    eventName: WebSocketEvents.nodesUpdate,
    eventHandler: useCallback((content) => dispatch(RecordActions.recordNodesUpdate(content)), []),
  })
  useOnWebSocketEvent({
    eventName: WebSocketEvents.nodeValidationsUpdate,
    eventHandler: useCallback((content) => dispatch(RecordActions.nodeValidationsUpdate(content)), []),
  })
  useOnWebSocketEvent({
    eventName: WebSocketEvents.nodesUpdateCompleted,
    eventHandler: useCallback((content) => dispatch(RecordActions.nodesUpdateCompleted(content)), []),
  })
  useOnWebSocketEvent({
    eventName: WebSocketEvents.recordDelete,
    eventHandler: useCallback(() => dispatch(RecordActions.recordDeleted(navigate)), []),
  })
  useOnWebSocketEvent({
    eventName: WebSocketEvents.recordSessionExpired,
    eventHandler: useCallback(() => dispatch(RecordActions.sessionExpired(navigate)), []),
  })
  useOnWebSocketEvent({
    eventName: WebSocketEvents.applicationError,
    eventHandler: useCallback(({ key, params }) => dispatch(RecordActions.applicationError(navigate, key, params)), []),
  })

  const componentLoad = () => {
    // Check in record
    // when previewing a survey or when the survey has been imported from Collect and not published,
    // record must be checked in as draft
    const draft = preview || !Survey.isPublished(surveyInfo)
    dispatch(RecordActions.checkInRecord({ recordUuid, draft, pageNodeUuid, pageNodeDefUuid, insideMap }))

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
