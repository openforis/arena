import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import SurveyFormView from '../../../surveyForm/surveyFormView'

import { getRecord } from '../../../surveyForm/record/recordState'
import { getSurveyForm } from '../../../surveyForm/surveyFormState'

import { initSurveyDefs } from '../../../../survey/actions'
import { resetForm } from '../../../surveyForm/actions'
import { createRecord, fetchRecord } from '../../../surveyForm/record/actions'

class Record extends React.Component {

  componentDidMount () {
    const {
      resetForm, initSurveyDefs,
      createRecord, fetchRecord,
      match
    } = this.props

    resetForm()

    // TODO load defs only if they don't exist or previously loaded draft for editing nodeDefs
    initSurveyDefs(false, false)

    const recordId = R.path(['params', 'recordId'], match)
    if (recordId) {
      fetchRecord(recordId)
    } else {
      createRecord()
    }

  }

  render () {
    const {ready} = this.props

    return ready
      ? <SurveyFormView draft={false} edit={false} entry={true}/>
      : null
  }
}

const mapStateToProps = state => {
  const record = getRecord(getSurveyForm(state))

  return {
    ready: !R.isEmpty(record)
  }
}

export default connect(
  mapStateToProps,
  {
    initSurveyDefs, resetForm,
    createRecord, fetchRecord
  }
)(Record)