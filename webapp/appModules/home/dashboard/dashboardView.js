import './dashboardView.scss'

import React from 'react'
import { connect } from 'react-redux'

import SurveyInfo from './components/surveyInfo'
import SurveyActionBar from './components/surveyActionsBar'

import * as SurveyState from '../../../survey/surveyState'

const DashboardView = ({ surveyInfo }) => (
  <div className="home-dashboard">
    <SurveyInfo surveyInfo={surveyInfo}/>
    <SurveyActionBar surveyInfo={surveyInfo}/>
  </div>
)

DashboardView.defaultProps = {
  surveyInfo: null
}

const mapStateToProps = state => ({
  surveyInfo: SurveyState.getStateSurveyInfo(state)
})

export default connect(mapStateToProps)(DashboardView)