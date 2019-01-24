import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import SurveyFormView from '../../../surveyForm/surveyFormView'

import * as AppState from '../../../../app/appState'
import * as RecordState from '../../../surveyForm/record/recordState'
import * as SurveyFormState from '../../../surveyForm/surveyFormState'

import { resetForm } from '../../../surveyForm/actions'
import { checkInRecord, checkOutRecord } from '../../../surveyForm/record/actions'

import AuthManager from '../../../../../common/auth/authManager'

class RecordView extends React.Component {

  constructor (props) {
    super(props)

    this.componentUnload = this.componentUnload.bind(this)
  }

  componentDidMount () {
    const {checkInRecord, recordUuidUrlParam} = this.props

    checkInRecord(recordUuidUrlParam)

    window.addEventListener('beforeunload', this.componentUnload)
  }

  componentWillUnmount () {
    this.componentUnload()
    window.removeEventListener('beforeunload', this.componentUnload)
  }

  componentUnload () {
    const {recordUuidUrlParam, recordLoaded, checkOutRecord, resetForm} = this.props

    if (recordLoaded)
      checkOutRecord(recordUuidUrlParam)

    resetForm()
  }

  render () {
    const {recordLoaded, preview, canEditRecord} = this.props

    return recordLoaded
      ? <SurveyFormView draft={preview} preview={preview} edit={false} entry={true} canEditRecord={canEditRecord}/>
      : null
  }
}

const mapStateToProps = (state, {match}) => {
  const surveyForm = SurveyFormState.getSurveyForm(state)
  const user = AppState.getUser(state)
  const record = RecordState.getRecord(surveyForm)

  return {
    canEditRecord: AuthManager.canEditRecord(user, record),
    recordLoaded: !R.isEmpty(record),
    recordUuidUrlParam: R.path(['params', 'recordUuid'], match),
  }
}

export default connect(
  mapStateToProps,
  {resetForm, checkInRecord, checkOutRecord}
)(RecordView)
