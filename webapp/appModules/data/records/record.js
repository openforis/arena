import React from 'react'
import { connect } from 'react-redux'

import SurveyFormView from '../../surveyForm/surveyFormView'

import { initSurveyDefs } from '../../../survey/actions'
import { resetForm } from '../../surveyForm/actions'

class Record extends React.Component {

  componentDidMount () {
    const {resetForm, initSurveyDefs} = this.props

    resetForm()
    initSurveyDefs(false, false)
  }

  render () {
    return (
      <SurveyFormView draft={false} edit={false} entry={true}/>
    )
  }
}

export default connect(
  null,
  {initSurveyDefs, resetForm}
)(Record)