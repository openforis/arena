import React, { useEffect, useRef } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { useHistory } from 'react-router'

import { getUrlParam } from '@webapp/utils/routerUtils'

import { useOnUpdate } from '@webapp/components/hooks'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'

import * as Authorizer from '@core/auth/authorizer'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import * as AppWebSocket from '@webapp/app/appWebSocket'

import { SurveyState } from '@webapp/store/survey'
import SurveyFormView from '../surveyForm/surveyFormView'
import { resetForm } from '../surveyForm/actions'

import { RecordActions, RecordState } from '@webapp/store/ui/record'
import { UserState } from '@webapp/store/user'

const RecordView = (props) => {
  const { recordLoaded, preview, canEditRecord, surveyCycleKey, sessionExpired, cycleChanged, applicationError } = props

  const history = useHistory()
  const recordLoadedRef = useRef(false)

  const componentLoad = () => {
    const {
      recordUuidUrlParam,
      pageNodeUuidUrlParam,
      pageNodeDefUuidUrlParam,
      checkInRecord,
      recordNodesUpdate,
      nodeValidationsUpdate,
      nodesUpdateCompleted,
      recordDeleted,
    } = props

    // Check in record
    checkInRecord(recordUuidUrlParam, preview, pageNodeUuidUrlParam, pageNodeDefUuidUrlParam)

    // Add websocket event listeners
    AppWebSocket.on(WebSocketEvents.nodesUpdate, recordNodesUpdate)
    AppWebSocket.on(WebSocketEvents.nodeValidationsUpdate, nodeValidationsUpdate)
    AppWebSocket.on(WebSocketEvents.nodesUpdateCompleted, nodesUpdateCompleted)
    AppWebSocket.on(WebSocketEvents.recordDelete, () => {
      recordDeleted(history)
    })
    AppWebSocket.on(WebSocketEvents.recordSessionExpired, () => {
      sessionExpired(history)
    })
    AppWebSocket.on(WebSocketEvents.applicationError, ({ key, params }) => {
      applicationError(history, key, params)
    })

    // Add beforeunload event listener
    window.addEventListener('beforeunload', componentUnload)
  }

  const componentUnload = () => {
    // Remove web socket listeners
    AppWebSocket.off(WebSocketEvents.nodesUpdate)
    AppWebSocket.off(WebSocketEvents.nodeValidationsUpdate)
    AppWebSocket.off(WebSocketEvents.nodesUpdateCompleted)
    AppWebSocket.off(WebSocketEvents.recordDelete)
    AppWebSocket.off(WebSocketEvents.recordSessionExpired)
    AppWebSocket.off(WebSocketEvents.applicationError)

    const { recordUuidUrlParam, checkOutRecord, resetForm } = props

    if (recordLoadedRef.current) {
      checkOutRecord(recordUuidUrlParam)
    }

    // Reset form
    resetForm()

    // Remove beforeunload event listener
    window.removeEventListener('beforeunload', componentUnload)
  }

  useEffect(() => {
    recordLoadedRef.current = recordLoaded
  }, [recordLoaded])

  useEffect(() => {
    componentLoad()
    return componentUnload
  }, [])

  useOnUpdate(() => {
    cycleChanged(history)
  }, [surveyCycleKey])

  return recordLoaded ? (
    <SurveyFormView draft={preview} preview={preview} edit={false} entry={true} canEditRecord={canEditRecord} />
  ) : null
}

const mapStateToProps = (state, { match, location }) => {
  const user = UserState.getUser(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  const record = RecordState.getRecord(state)
  const urlSearchParams = new URLSearchParams(location.search)
  const recordUuidPreview = RecordState.getRecordUuidPreview(state)

  return {
    canEditRecord:
      Authorizer.canEditRecord(user, record) && (Survey.isPublished(surveyInfo) || Record.isPreview(record)),
    recordLoaded: Boolean(record),
    recordUuidUrlParam: getUrlParam('recordUuid')(match) || recordUuidPreview,
    pageNodeUuidUrlParam: urlSearchParams.get('pageNodeUuid'),
    pageNodeDefUuidUrlParam: urlSearchParams.get('pageNodeDefUuid'),
    surveyCycleKey,
    preview: Boolean(recordUuidPreview),
  }
}

const enhance = compose(
  withRouter,
  connect(mapStateToProps, {
    resetForm,
    checkInRecord: RecordActions.checkInRecord,
    checkOutRecord: RecordActions.checkOutRecord,
    recordNodesUpdate: RecordActions.recordNodesUpdate,
    nodeValidationsUpdate: RecordActions.nodeValidationsUpdate,
    nodesUpdateCompleted: RecordActions.nodesUpdateCompleted,
    recordDeleted: RecordActions.recordDeleted,
    sessionExpired: RecordActions.sessionExpired,
    cycleChanged: RecordActions.cycleChanged,
    applicationError: RecordActions.applicationError,
  })
)

export default enhance(RecordView)
