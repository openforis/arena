import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import SurveyFormView from '../../../surveyForm/surveyFormView'

import { getRecord } from '../../../surveyForm/record/recordState'
import { getSurveyForm } from '../../../surveyForm/surveyFormState'

import { initSurveyDefs } from '../../../../survey/actions'
import { resetForm } from '../../../surveyForm/actions'
import { checkInRecord, checkOutRecord } from '../../../surveyForm/record/actions'

import { appModules, appModuleUri } from '../../../appModules'

class Record extends React.Component {

  constructor (props) {
    super(props)

    this.componentUnload = this.componentUnload.bind(this)
  }

  componentDidMount () {
    const {
      initSurveyDefs, checkInRecord,
      recordUuidUrlParam,
    } = this.props

    // TODO load defs only if they don't exist or previously loaded draft for editing nodeDefs
    initSurveyDefs(false, false)

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
    this.props.resetForm()
    this.props.checkOutRecord()
  }

  render () {
    const {recordUuid} = this.props

    return recordUuid
      ? <SurveyFormView draft={false} edit={false} entry={true}/>
      : null
  }
}

const mapStateToProps = (state, {match}) => {
  const record = getRecord(getSurveyForm(state))
  const recordUuidUrlParam = R.path(['params', 'recordUuid'], match)

  return {
    recordUuid: R.prop('uuid', record),
    recordUuidUrlParam,
  }
}

export default connect(
  mapStateToProps,
  {
    initSurveyDefs, resetForm,
    checkInRecord, checkOutRecord,
  }
)(Record)