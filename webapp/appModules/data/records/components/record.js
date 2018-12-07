import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import SurveyFormView from '../../../surveyForm/surveyFormView'

import { getRecord } from '../../../surveyForm/record/recordState'
import { getSurveyForm } from '../../../surveyForm/surveyFormState'

import { initSurveyDefs } from '../../../../survey/actions'
import { resetForm } from '../../../surveyForm/actions'
import { createRecord, checkInRecord, checkOutRecord } from '../../../surveyForm/record/actions'

import { appModules, appModuleUri } from '../../../appModules'

class Record extends React.Component {

  constructor (props) {
    super(props)

    this.componentUnload = this.componentUnload.bind(this)
  }

  componentDidMount () {
    const {
      resetForm, initSurveyDefs,
      createRecord, checkInRecord,
      match
    } = this.props

    resetForm()

    // TODO load defs only if they don't exist or previously loaded draft for editing nodeDefs
    initSurveyDefs(false, false)

    const recordUuid = R.path(['params', 'recordUuid'], match)
    if (recordUuid) {
      checkInRecord(recordUuid)
    } else {
      createRecord()
    }

    window.addEventListener('beforeunload', this.componentUnload)
  }

  componentDidUpdate (prevProps) {
    const {recordUuid, history} = this.props
    const {recordUuid: prevRecordUuid} = prevProps

    // record has been deleted
    if (prevRecordUuid && !recordUuid)
      history.replace(appModuleUri(appModules.data))
  }

  componentWillUnmount () {
    this.props.resetForm()
    this.componentUnload()
    window.removeEventListener('beforeunload', this.componentUnload)
  }

  componentUnload () {
    this.props.checkOutRecord()
  }

  render () {
    const {recordUuid} = this.props

    return recordUuid
      ? <SurveyFormView draft={false} edit={false} entry={true}/>
      : null
  }
}

const mapStateToProps = state => {
  const record = getRecord(getSurveyForm(state))

  return {
    recordUuid: R.prop('uuid', record)
  }
}

export default connect(
  mapStateToProps,
  {
    initSurveyDefs, resetForm,
    createRecord, checkInRecord, checkOutRecord,
  }
)(Record)