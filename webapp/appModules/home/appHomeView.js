import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import AddSurveyForm from './addSurveyForm'
import SurveysList from './surveysList'

import { appModuleUri, getSurveys } from '../../app/app'
import { getNewSurvey } from '../../app/appState'
import { appModules } from '../appModules'

import { getSurveyInfo } from '../../../common/survey/survey'
import { getSurvey } from '../../survey/surveyState'

import { fetchSurveys, setActiveSurvey, createSurvey, resetNewSurvey, updateNewSurveyProp } from '../../app/actions'

class AppHomeView extends React.Component {

  componentDidMount () {
    this.props.fetchSurveys()
  }

  componentDidUpdate (prevProps) {

    const {surveyInfo: prevSurveyInfo} = prevProps
    const {surveyInfo, history} = this.props

    if (surveyInfo && (!prevSurveyInfo || surveyInfo.id !== prevSurveyInfo.id)) {
      history.push(appModuleUri(appModules.surveyDashboard))
    }
  }

  componentWillUnmount () {
    this.props.resetNewSurvey()
  }

  render () {
    return (
      <div style={{
        display: 'grid',
        gridTemplateRows: '90px 2rem .95fr',
      }}>

        <AddSurveyForm {...this.props}/>

        <div/>

        <SurveysList {...this.props}/>

      </div>
    )
  }
}

const mapStateToProps = state => ({
  newSurvey: getNewSurvey(state),
  surveyInfo: getSurveyInfo(getSurvey(state)),
  surveys: getSurveys(state)
})

export default withRouter(connect(
  mapStateToProps,
  {
    createSurvey,
    updateNewSurveyProp,
    resetNewSurvey,
    fetchSurveys,
    setActiveSurvey,
  }
)(AppHomeView))