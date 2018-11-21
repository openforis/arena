import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import SurveyFormView from '../../../surveyForm/surveyFormView'

import { initSurveyDefs } from '../../../../survey/actions'
import { resetForm } from '../../../surveyForm/actions'
import { createRecord } from '../../../surveyForm/record/actions'

class Record extends React.Component {

  componentDidMount () {
    const {resetForm, initSurveyDefs, createRecord, match} = this.props

    resetForm()

    // TODO load defs only if they don't exist or previously loaded draft for editing nodeDefs
    initSurveyDefs(false, false)

    const recordId = R.path(['params', 'recordId'], match)
    if (recordId) {
      // TODO LOAD RECORD
    } else {
      createRecord()
    }

  }

  render () {
    return (
      <SurveyFormView draft={false} edit={false} entry={true}/>
    )
  }
}

export default connect(
  null,
  {initSurveyDefs, resetForm, createRecord}
)(Record)