import './homeView.scss'

import React from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { Route, Switch, withRouter } from 'react-router'
import { Redirect } from 'react-router-dom'

import DashboardView from './dashboard/dashboardView'
import SurveyListView from './surveyList/surveyListView'
import SurveyCreateView from './surveyCreate/surveyCreateView'
import SurveyInfoView from './surveyInfo/surveyInfoView'

import Survey from '../../../common/survey/survey'
import * as SurveyState from '../../survey/surveyState'

import { appModules, appModuleUri } from '../appModules'
import { homeModules } from './homeModules'

class HomeView extends React.Component {

  componentDidUpdate (prevProps) {
    const { surveyInfo, history } = this.props
    const { surveyInfo: prevSurveyInfo } = prevProps

    // active survey change
    if (
      surveyInfo && (
        // new survey created
        !prevSurveyInfo
        // changed from survey list
        || surveyInfo.id !== prevSurveyInfo.id
      )
    ) {
      history.push(appModuleUri(homeModules.dashboard))
    }

    // survey deleted
    if (Survey.isValid(prevSurveyInfo) && !Survey.isValid(surveyInfo)) {
      history.push(appModuleUri(homeModules.surveyList))
    }
  }

  render () {
    const { location } = this.props

    const isHomeUri = location.pathname === appModuleUri(appModules.home)

    return isHomeUri
      ? (
        <Redirect to={appModuleUri(homeModules.dashboard)}/>
      ) : (
        <div className="app-home">
          <Switch location={location}>
            <Route path={appModuleUri(homeModules.dashboard)} component={DashboardView}/>
            <Route path={appModuleUri(homeModules.surveyList)} component={SurveyListView}/>
            <Route path={appModuleUri(homeModules.surveyNew)} component={SurveyCreateView}/>
            <Route path={appModuleUri(homeModules.surveyInfo)} component={SurveyInfoView}/>
          </Switch>
        </div>
      )
  }
}

const mapStateToProps = state => ({
  surveyInfo: Survey.getSurveyInfo(SurveyState.getSurvey(state)),
})

const enhance = compose(
  withRouter,
  connect(mapStateToProps)
)

export default enhance(HomeView)