import './surveyListView.scss'

import React from 'react'
import { connect } from 'react-redux'

import SurveyListTable from './surveyListTable'

import Survey from '../../../../common/survey/survey'

import * as AppHomeState from '../appHomeState'
import * as SurveyState from '../../../survey/surveyState'

import { fetchSurveys } from '../actions'
import { setActiveSurvey } from '../../../survey/actions'

class SurveyListView extends React.Component {

  componentDidMount () {
    this.props.fetchSurveys()
  }

  render () {
    const { surveyInfo, surveys, setActiveSurvey } = this.props

    return (
      <SurveyListTable
        surveys={surveys}
        surveyInfo={surveyInfo}
        setActiveSurvey={setActiveSurvey}
      />
    )
  }
}

const mapStateToProps = state => ({
  surveyInfo: Survey.getSurveyInfo(SurveyState.getSurvey(state)),
  surveys: AppHomeState.getSurveys(state)
})

export default connect(
  mapStateToProps,
  { fetchSurveys, setActiveSurvey }
)(SurveyListView)
