import React, { useEffect, useRef } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { getUrlParam } from '@webapp/utils/routerUtils'

import { useOnUpdate } from '@webapp/commonComponents/hooks'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'

import SurveyFormView from '../surveyForm/surveyFormView'

import * as Authorizer from '@core/auth/authorizer'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import * as AppWebSocket from '@webapp/app/appWebSocket'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'
import * as RecordState from './recordState'

import { resetForm } from '../surveyForm/actions'
import {
  checkInRecord,
  checkOutRecord,
  recordNodesUpdate,
  nodeValidationsUpdate,
  nodesUpdateCompleted,
  recordDeleted,
  sessionExpired,
  cycleChanged,
  applicationError,
} from './actions'

const RecordView = props => {
  const {
    recordLoaded, preview, canEditRecord, surveyCycleKey,
    sessionExpired, cycleChanged, history,
    applicationError,
  } = props

  const recordLoadedRef = useRef(false)

  const componentLoad = () => {
    const {
      recordUuidUrlParam, parentNodeUuidUrlParam,
      checkInRecord,
      recordNodesUpdate, nodeValidationsUpdate, nodesUpdateCompleted, recordDeleted
    } = props

    // check in record
    checkInRecord(recordUuidUrlParam, preview, parentNodeUuidUrlParam)

    // add websocket event listeners
    AppWebSocket.on(WebSocketEvents.nodesUpdate, recordNodesUpdate)
    AppWebSocket.on(WebSocketEvents.nodeValidationsUpdate, nodeValidationsUpdate)
    AppWebSocket.on(WebSocketEvents.nodesUpdateCompleted, nodesUpdateCompleted)
    AppWebSocket.on(WebSocketEvents.recordDelete, () => {
      recordDeleted(history)
    })
    AppWebSocket.on(WebSocketEvents.recordSessionExpired, () => {
      sessionExpired(history)
    })
    AppWebSocket.on(WebSocketEvents.applicationError, ({key, params}) => {
      applicationError(history, recordUuidUrlParam, key, params)
    })

    // add beforeunload event listener
    window.addEventListener('beforeunload', componentUnload)
  }

  const componentUnload = () => {
    // remove web socket listeners
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

    // reset form
    resetForm()

    // remove beforeunload event listener
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

  return recordLoaded
    ? (
      <SurveyFormView
        draft={preview}
        preview={preview}
        edit={false}
        entry={true}
        canEditRecord={canEditRecord}
      />
    )
    : null
}

const mapStateToProps = (state, { match, location }) => {
  const user = AppState.getUser(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  const record = RecordState.getRecord(state)
  const urlSearchParams = new URLSearchParams(location.search)
  const recordUuidPreview = RecordState.getRecordUuidPreview(state)

  return {
    canEditRecord: Authorizer.canEditRecord(user, record) && (Survey.isPublished(surveyInfo) || Record.isPreview(record)),
    recordLoaded: !!record,
    recordUuidUrlParam: getUrlParam('recordUuid')(match) || recordUuidPreview,
    parentNodeUuidUrlParam: urlSearchParams.get('parentNodeUuid'),
    surveyCycleKey,
    preview: !!recordUuidPreview,
    applicationError,
  }
}

const enhance = compose(
  withRouter,
  connect(
    mapStateToProps,
    {
      resetForm, checkInRecord, checkOutRecord,
      recordNodesUpdate, nodeValidationsUpdate, nodesUpdateCompleted,
      recordDeleted, sessionExpired, cycleChanged, applicationError,
    }
  )
)

export default enhance(RecordView)