import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import * as Survey from '@core/survey/survey'

import { RecordActions, RecordState } from '@webapp/store/ui/record'
import { useSurveyInfo, useSurveyCycleKey } from '@webapp/store/survey'
import { useAuthCanEditRecord } from '@webapp/store/user'

import { useOnUpdate, useQuery, useOnWebSocketEvent } from '@webapp/components/hooks'

export const useLocalState = (props) => {
  const {
    recordUuid: recordUuidProp,
    pageNodeUuid: pageNodeUuidProp,
    pageNodeDefUuid: pageNodeDefUuidProp,
    noHeader: noHeaderProp = false,
  } = props
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { recordUuid: recordUuidUrlParam } = useParams()

  const {
    pageNodeUuid: pageNodeUuidUrlParam,
    pageNodeDefUuid: pageNodeDefUuidUrlParam,
    noHeader: noHeaderUrlParam,
  } = useQuery()

  const recordUuidPreview = useSelector(RecordState.getRecordUuidPreview)
  const preview = Boolean(recordUuidPreview)

  const recordUuid = recordUuidProp || recordUuidUrlParam || recordUuidPreview
  const pageNodeUuid = pageNodeUuidProp || pageNodeUuidUrlParam
  const pageNodeDefUuid = pageNodeDefUuidProp || pageNodeDefUuidUrlParam
  const noHeader = noHeaderProp || noHeaderUrlParam

  const surveyInfo = useSurveyInfo()
  const surveyCycleKey = useSurveyCycleKey()

  const record = useSelector(RecordState.getRecord)
  const recordLoadError = useSelector(RecordState.getRecordLoadError)
  const editable = useAuthCanEditRecord(record)

  // Add websocket event listeners
  useOnWebSocketEvent({
    eventName: WebSocketEvents.nodesUpdate,
    eventHandler: useCallback((content) => dispatch(RecordActions.recordNodesUpdate(content.updatedNodes)), []),
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

  const onComponentUnload = () => {
    dispatch(RecordActions.checkOutRecord(recordUuid))

    // Remove beforeunload event listener
    window.removeEventListener('beforeunload', onComponentUnload)
  }

  const onComponentLoad = () => {
    // Check in record
    // when previewing a survey or when the survey has been imported from Collect and not published,
    // record must be checked in as draft
    const draft = preview || !Survey.isPublished(surveyInfo)
    dispatch(RecordActions.checkInRecord({ recordUuid, draft, pageNodeUuid, pageNodeDefUuid, noHeader }))

    // Add beforeunload event listener
    window.addEventListener('beforeunload', onComponentUnload)
  }

  useEffect(() => {
    onComponentLoad()
    return onComponentUnload
  }, [])

  useOnUpdate(() => {
    dispatch(RecordActions.cycleChanged(navigate))
  }, [surveyCycleKey])

  return { editable, preview, record, recordLoadError }
}
