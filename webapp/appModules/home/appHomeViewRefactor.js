import './appHomeView.scss'

import React from 'react'
import { Route, Switch } from 'react-router'
import { Redirect } from 'react-router-dom'

import DashboardView from './dashboard/dashboardView'
import SurveyListView from './surveyList/surveyListView'

import { appModules, appModuleUri } from '../appModules'
import { homeModules } from './homeModules'

const AppHomeView = props => {

  const { location } = props

  return location.pathname === appModuleUri(appModules.home)
    ? (
      <Redirect to={appModuleUri(homeModules.dashboard)}/>
    ) : (
      <div className="app-home">
        <Switch location={location}>
          <Route path={appModuleUri(homeModules.dashboard)} component={DashboardView}/>
          <Route path={appModuleUri(homeModules.surveys)} component={SurveyListView}/>
        </Switch>
      </div>
    )
}

export default AppHomeView