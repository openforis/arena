import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import SurveyFormView from '../../../surveyForm/surveyFormView'

import Record from '../../../../../common/record/record'

import * as RecordState from '../../../surveyForm/record/recordState'
import * as SurveyFormState from '../../../surveyForm/surveyFormState'

import { resetForm } from '../../../surveyForm/actions'
import { checkInRecord, checkOutRecord } from '../../../surveyForm/record/actions'

import { appModules, appModuleUri } from '../../../appModules'

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
    const {recordLoaded, preview} = this.props

    return recordLoaded
      ? <SurveyFormView draft={preview} preview={preview} edit={false} entry={true} canEditRecord={false}/>
      : null
  }
}

const mapStateToProps = (state, {match}) => {
  const surveyForm = SurveyFormState.getSurveyForm(state)
  const record = RecordState.getRecord(surveyForm)

  return {
    recordLoaded: !R.isEmpty(record),
    recordUuidUrlParam: R.path(['params', 'recordUuid'], match),
  }
}

export default connect(
  mapStateToProps,
  {resetForm, checkInRecord, checkOutRecord}
)(RecordView)
