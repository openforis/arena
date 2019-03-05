import './surveyListView.scss'

import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { compose } from 'redux'

import SurveyListTable from './surveyListTable'

import Survey from '../../../../common/survey/survey'

import * as AppHomeState from '../appHomeState'
import * as SurveyState from '../../../survey/surveyState'

import { fetchSurveys } from '../actions'
import { setActiveSurvey } from '../../../survey/actions'

import { appModuleUri } from '../../appModules'
import { homeModules } from '../homeModules'

class SurveyListView extends React.Component {

  componentDidMount () {
    this.props.fetchSurveys()
  }

  componentDidUpdate (prevProps) {
    const { surveyInfo, history } = this.props
    const { surveyInfo: prevSurveyInfo } = prevProps

    if (surveyInfo && (!prevSurveyInfo || surveyInfo.id !== prevSurveyInfo.id)) {
      history.push(appModuleUri(homeModules.dashboard))
    }
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

const enhance = compose(
  withRouter,
  connect(
    mapStateToProps,
    { fetchSurveys, setActiveSurvey }
  )
)

export default enhance(SurveyListView)
