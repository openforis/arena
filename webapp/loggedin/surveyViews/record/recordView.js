import React, { useEffect, useRef } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import * as R from 'ramda'

import { getUrlParam } from '../../../utils/routerUtils'

import { useOnUpdate } from '../../../commonComponents/hooks'

import Survey from '../../../../common/survey/survey'
import Record from '../../../../common/record/record'

import SurveyFormView from '../surveyForm/surveyFormView'

import Authorizer from '../../../../common/auth/authorizer'
import WebSocketEvents from '../../../../common/webSocket/webSocketEvents'
import * as AppWebSocket from '../../../app/appWebSocket'

import * as AppState from '../../../app/appState'
import * as SurveyState from '../../../survey/surveyState'
import * as RecordState from './recordState'

import { resetForm } from '../surveyForm/actions'
import {
  checkInRecord,
  checkOutRecord,
  recordNodesUpdate,
  nodeValidationsUpdate,
  recordDeleted,
  sessionExpired,
  cycleChanged
} from './actions'

const RecordView = props => {
  const {
    recordLoaded, preview, canEditRecord, surveyCycleKey,
    sessionExpired, cycleChanged, history
  } = props

  const recordLoadedRef = useRef(false)

  const componentLoad = () => {
    const {
      recordUuidUrlParam, parentNodeUuidUrlParam, draftDefs,
      checkInRecord,
      recordNodesUpdate, nodeValidationsUpdate, recordDeleted
    } = props

    // check in record
    checkInRecord(recordUuidUrlParam, draftDefs, parentNodeUuidUrlParam)

    // add websocket event listeners
    AppWebSocket.on(WebSocketEvents.nodesUpdate, recordNodesUpdate)
    AppWebSocket.on(WebSocketEvents.nodeValidationsUpdate, nodeValidationsUpdate)
    AppWebSocket.on(WebSocketEvents.recordDelete, () => {
      recordDeleted(history)
    })
    AppWebSocket.on(WebSocketEvents.recordSessionExpired, () => {
      sessionExpired(history)
    })

    // add beforeunload event listener
    window.addEventListener('beforeunload', componentUnload)
  }

  const componentUnload = () => {
    // remove web socket listeners
    AppWebSocket.off(WebSocketEvents.nodesUpdate)
    AppWebSocket.off(WebSocketEvents.nodeValidationsUpdate)
    AppWebSocket.off(WebSocketEvents.recordDelete)
    AppWebSocket.off(WebSocketEvents.recordSessionExpired)

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

  return {
    canEditRecord: Authorizer.canEditRecord(user, record) && (Survey.isPublished(surveyInfo) || Record.isPreview(record)),
    recordLoaded: !R.isEmpty(record),
    recordUuidUrlParam: getUrlParam('recordUuid')(match),
    parentNodeUuidUrlParam: urlSearchParams.get('parentNodeUuid'),
    surveyCycleKey
  }
}

const enhance = compose(
  withRouter,
  connect(
    mapStateToProps,
    {
      resetForm, checkInRecord, checkOutRecord,
      recordNodesUpdate, nodeValidationsUpdate, recordDeleted, sessionExpired, cycleChanged
    }
  )
)

export default enhance(RecordView)