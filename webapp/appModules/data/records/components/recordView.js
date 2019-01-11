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

  componentDidUpdate (prevProps) {
    const {recordUuid, history} = this.props
    const {recordUuid: prevRecordUuid} = prevProps

    // record has been deleted
    if (prevRecordUuid && !recordUuid)
      history.push(appModuleUri(appModules.data))
  }

  componentWillUnmount () {
    this.componentUnload()
    window.removeEventListener('beforeunload', this.componentUnload)
  }

  componentUnload () {
    this.props.checkOutRecord()
    this.props.resetForm()
  }

  render () {
    const {recordUuid, preview} = this.props

    return recordUuid
      ? <SurveyFormView draft={preview} preview={preview} edit={false} entry={true}/>
      : null
  }
}

const mapStateToProps = (state, {match}) => {
  const surveyForm = SurveyFormState.getSurveyForm(state)
  const record = RecordState.getRecord(surveyForm)

  return {
    recordUuid: Record.getUuid(record),
    recordUuidUrlParam: R.path(['params', 'recordUuid'], match),
  }
}

export default connect(
  mapStateToProps,
  {resetForm, checkInRecord, checkOutRecord}
)(RecordView)
