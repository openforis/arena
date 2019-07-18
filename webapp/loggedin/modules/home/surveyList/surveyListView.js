import './surveyListView.scss'

import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import Survey from '../../../../../common/survey/survey'

import SurveyListTable from './surveyListTable'

import * as SurveyListState from './surveyListState'
import * as SurveyState from '../../../../survey/surveyState'
import { appModuleUri, homeModules } from '../../../appModules'

import { fetchSurveys } from './actions'
import { setActiveSurvey } from '../../../../survey/actions'

const SurveyListView = props => {

  const {
    surveyInfo, surveys, history,
    setActiveSurvey, fetchSurveys
  } = props

  const [fetched, setFetched] = useState(false)

  //onMount fetch surveys
  useEffect(() => {
    fetchSurveys()
    setFetched(true)
  }, [])

  const surveysLength = R.length(surveys)
  useEffect(() => {
    // redirect to create survey when (after fetching surveys) there are no surveys
    if (fetched === true && surveysLength === 0) {
      history.push(appModuleUri(homeModules.surveyNew))
    }
  }, [surveysLength])

  return !R.isEmpty(surveys) &&
    <SurveyListTable
      surveys={surveys}
      surveyInfo={surveyInfo}
      setActiveSurvey={setActiveSurvey}
    />
}

const mapStateToProps = state => ({
  surveyInfo: Survey.getSurveyInfo(SurveyState.getSurvey(state)),
  surveys: SurveyListState.getSurveys(state),
})

export default connect(
  mapStateToProps,
  { fetchSurveys, setActiveSurvey }
)(SurveyListView)
