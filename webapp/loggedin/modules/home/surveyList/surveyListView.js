import './surveyListView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import Survey from '../../../../../common/survey/survey'

import SurveyListTable from './surveyListTable'
import { useOnUpdate } from '../../../../commonComponents/hooks'

import * as AppState from '../../../../app/appState'
import * as SurveyListState from './surveyListState'
import * as SurveyState from '../../../../survey/surveyState'
import { appModuleUri, homeModules } from '../../../appModules'

import { fetchSurveys } from './actions'
import { setActiveSurvey } from '../../../../survey/actions'

const SurveyListView = props => {

  const {
    user, surveyInfo, surveys, history,
    setActiveSurvey, fetchSurveys
  } = props

  //onMount fetch surveys
  useEffect(() => {
    fetchSurveys()
  }, [])

  // redirect to dashboard on survey change
  useOnUpdate(() => {
    history.push(appModuleUri(homeModules.dashboard))
  }, [Survey.getUuid(surveyInfo)])

  return !R.isEmpty(surveys) &&
    <SurveyListTable
      user={user}
      surveys={surveys}
      surveyInfo={surveyInfo}
      setActiveSurvey={setActiveSurvey}
    />
}

const mapStateToProps = state => ({
  user: AppState.getUser(state),
  surveyInfo: SurveyState.getSurveyInfo(state),
  surveys: SurveyListState.getSurveys(state),
})

export default connect(
  mapStateToProps,
  { fetchSurveys, setActiveSurvey }
)(SurveyListView)
