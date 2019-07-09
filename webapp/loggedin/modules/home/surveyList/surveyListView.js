import './surveyListView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import SurveyListTable from './surveyListTable'

import Survey from '../../../../../common/survey/survey'

import * as SurveyListState from './surveyListState'
import * as SurveyState from '../../../../survey/surveyState'

import { fetchSurveys } from './actions'
import { setActiveSurvey } from '../../../../survey/actions'

const SurveyListView = props => {

  const {
    surveyInfo, surveys,
    setActiveSurvey, fetchSurveys
  } = props

  const surveysLength = R.length(surveys)

  useEffect(() => {
    fetchSurveys()
  }, [])

  return !R.isEmpty(surveys) &&
    <SurveyListTable
      surveys={surveys}
      surveyInfo={surveyInfo}
      setActiveSurvey={setActiveSurvey}
    />
}

const mapStateToProps = state => ({
  surveyInfo: Survey.getSurveyInfo(SurveyState.getSurvey(state)),
  surveys: SurveyListState.getState(state)
})

export default connect(
  mapStateToProps,
  { fetchSurveys, setActiveSurvey }
)(SurveyListView)
