import React, { useEffect, useRef } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import * as R from 'ramda'

import Survey from '../../../../../../common/survey/survey'
import Record from '../../../../../../common/record/record'

import SurveyFormView from '../../../../surveyViews/surveyForm/surveyFormView'

import Authorizer from '../../../../../../common/auth/authorizer'
import WebSocketEvents from '../../../../../../common/webSocket/webSocketEvents'
import * as AppWebSocket from '../../../../../app/appWebSocket'

import * as AppState from '../../../../../app/appState'
import * as SurveyState from '../../../../../survey/surveyState'
import * as RecordState from '../../../../surveyViews/record/recordState'

import { resetForm } from '../../../../surveyViews/surveyForm/actions'
import {
  checkInRecord,
  checkOutRecord,
  recordNodesUpdate,
  nodeValidationsUpdate,
  dispatchRecordDelete
} from '../../../../surveyViews/record/actions'

const RecordView = props => {
  const { recordLoaded, preview, canEditRecord } = props

  const recordLoadedRef = useRef()

  const addWebSocketListeners = () => {
    const { recordNodesUpdate, nodeValidationsUpdate, dispatchRecordDelete, history } = props

    AppWebSocket.on(WebSocketEvents.nodesUpdate, recordNodesUpdate)
    AppWebSocket.on(WebSocketEvents.nodeValidationsUpdate, nodeValidationsUpdate)
    AppWebSocket.on(WebSocketEvents.recordDelete, () => {
      alert('This record has just been deleted by another user')
      dispatchRecordDelete(history)
    })
  }

  const removeWebSocketListeners = () => {
    AppWebSocket.off(WebSocketEvents.nodesUpdate)
    AppWebSocket.off(WebSocketEvents.nodeValidationsUpdate)
    AppWebSocket.off(WebSocketEvents.recordDelete)
  }

  const componentUnload = () => {
    removeWebSocketListeners()

    const { recordUuidUrlParam, checkOutRecord, resetForm } = props

    if (recordLoadedRef.current) {
      checkOutRecord(recordUuidUrlParam)
    }

    resetForm()
  }

  useEffect(() => { recordLoadedRef.current = recordLoaded }, [recordLoaded])

  useEffect(() => {
    const { checkInRecord, recordUuidUrlParam, parentNodeUuidUrlParam, nodeDefUuidUrlParam } = props

    checkInRecord(recordUuidUrlParam, parentNodeUuidUrlParam, nodeDefUuidUrlParam)

    window.addEventListener('beforeunload', componentUnload)
    addWebSocketListeners()

    return () => {
      componentUnload()
      window.removeEventListener('beforeunload', componentUnload)
    }
  }, [])

  return recordLoaded
    ? <SurveyFormView
        draft={preview}
        preview={preview}
        edit={false}
        entry={true}
        canEditRecord={canEditRecord}/>
    : null
}


const mapStateToProps = (state, { match, location }) => {
  const user = AppState.getUser(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const record = RecordState.getRecord(state)
  const urlSearchParams = new URLSearchParams(location.search)

  return {
    canEditRecord: Authorizer.canEditRecord(user, record) && (Survey.isPublished(surveyInfo) || Record.isPreview(record)),
    recordLoaded: !R.isEmpty(record),
    recordUuidUrlParam: R.path(['params', 'recordUuid'], match),
    parentNodeUuidUrlParam: urlSearchParams.get('parentNodeUuid'),
    nodeDefUuidUrlParam: urlSearchParams.get('nodeDefUuid')
  }
}

const enhance = compose(
  withRouter,
  connect(
    mapStateToProps,
    {
      resetForm, checkInRecord, checkOutRecord,
      recordNodesUpdate, nodeValidationsUpdate, dispatchRecordDelete
    }
  )
)

export default enhance(RecordView)