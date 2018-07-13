import './style.scss'

import React from 'react'
import { Route } from 'react-router'

import AppHeader from './components/appHeader'
import AppDashboardView from '../appDashboard/appDashboardView'

import { appUri } from './app'
import { appModules } from '../appModules/appModules'

const AppView = (props) =>
  <div className="app__container">

    <AppHeader {...props} />

    <Route exact path={appUri()}
           component={AppDashboardView}/>

    <Route exact path={appUri(appModules.surveyDesigner)}
           render={() => <div>Survey Designer</div>}/>

  </div>

export default AppView