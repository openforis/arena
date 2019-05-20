import React from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import * as R from 'ramda'

import Survey from '../../../../../../common/survey/survey'

import SurveyFormView from '../../../../surveyViews/surveyForm/surveyFormView'

import AuthManager from '../../../../../../common/auth/authManager'
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

class RecordView extends React.Component {

  constructor (props) {
    super(props)

    this.componentUnload = this.componentUnload.bind(this)
  }

  addWebSocketListeners () {
    const { recordNodesUpdate, nodeValidationsUpdate, dispatchRecordDelete, history } = this.props

    AppWebSocket.on(WebSocketEvents.nodesUpdate, recordNodesUpdate)
    AppWebSocket.on(WebSocketEvents.nodeValidationsUpdate, nodeValidationsUpdate)
    AppWebSocket.on(WebSocketEvents.recordDelete, () => {
      alert('This record has just been deleted by another user')
      dispatchRecordDelete(history)
    })
  }

  componentDidMount () {
    const { checkInRecord, recordUuidUrlParam, parentNodeUuidUrlParam, nodeDefUuidUrlParam } = this.props
    checkInRecord(recordUuidUrlParam, parentNodeUuidUrlParam, nodeDefUuidUrlParam)

    window.addEventListener('beforeunload', this.componentUnload)

    this.addWebSocketListeners()
  }

  componentWillUnmount () {
    this.componentUnload()
    window.removeEventListener('beforeunload', this.componentUnload)
  }

  componentUnload () {
    const { recordUuidUrlParam, recordLoaded, checkOutRecord, resetForm } = this.props

    if (recordLoaded)
      checkOutRecord(recordUuidUrlParam)

    resetForm()
  }

  render () {
    const { recordLoaded, preview, canEditRecord } = this.props

    return recordLoaded
      ? <SurveyFormView draft={preview} preview={preview} edit={false} entry={true} canEditRecord={canEditRecord}/>
      : null
  }
}

const mapStateToProps = (state, { match, location }) => {
  const user = AppState.getUser(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const record = RecordState.getRecord(state)
  const urlSearchParams = new URLSearchParams(location.search)

  return {
    canEditRecord: Survey.isPublished(surveyInfo) && AuthManager.canEditRecord(user, record),
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