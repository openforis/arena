import React from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import * as R from 'ramda'

import SurveyFormView from '../../../../surveyViews/surveyForm/surveyFormView'

import * as AppState from '../../../../../app/appState'
import * as RecordState from '../../../../surveyViews/record/recordState'
import * as SurveyFormState from '../../../../surveyViews/surveyForm/surveyFormState'

import { resetForm } from '../../../../surveyViews/surveyForm/actions'
import { checkInRecord, checkOutRecord } from '../../../../surveyViews/record/actions'

import AuthManager from '../../../../../../common/auth/authManager'

class RecordView extends React.Component {

  constructor (props) {
    super(props)

    this.componentUnload = this.componentUnload.bind(this)
  }

  componentDidMount () {
    const { checkInRecord, recordUuidUrlParam, parentNodeUuidUrlParam, nodeDefUuidUrlParam} = this.props

    checkInRecord(recordUuidUrlParam, parentNodeUuidUrlParam, nodeDefUuidUrlParam)

    window.addEventListener('beforeunload', this.componentUnload)
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
  const surveyForm = SurveyFormState.getSurveyForm(state)
  const user = AppState.getUser(state)
  const record = RecordState.getRecord(surveyForm)
  const urlSearchParams = new URLSearchParams(location.search)

  return {
    canEditRecord: AuthManager.canEditRecord(user, record),
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
    { resetForm, checkInRecord, checkOutRecord }
  )
)

export default enhance(RecordView)
