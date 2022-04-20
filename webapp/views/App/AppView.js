import './AppView.scss'

import React, { useEffect } from 'react'

import { appModules } from '@webapp/app/appModules'
import { AppReducer, AppState } from '@webapp/store/app'
import { injectReducers } from '@webapp/store'

import { useAuthCanUseAnalysis } from '@webapp/store/user'
import ModuleSwitch from '@webapp/components/moduleSwitch'

import Header from './Header'
import JobMonitor from './JobMonitor'
import ServiceErrors from './ServiceErrors'
import SideBar from './SideBar'

import Analysis from './views/Analysis' // TODO load Analysis module lazily
const Data = React.lazy(() => import('./views/Data'))
const Designer = React.lazy(() => import('./views/Designer'))
const Home = React.lazy(() => import('./views/Home'))
const Users = React.lazy(() => import('./views/Users'))
const Help = React.lazy(() => import('./views/Help'))

const AppView = () => {
  useEffect(() => {
    injectReducers(AppState.stateKey, AppReducer)
  }, [])

  const canAnalyzeRecords = useAuthCanUseAnalysis()

  return (
    <>
      <Header />

      <div className="app__container">
        <SideBar />
        <div className="app-module">
          <ModuleSwitch
            moduleDefault={appModules.home}
            modules={[
              {
                component: Home,
                path: `${appModules.home.path}/*`,
              },
              {
                component: Designer,
                path: `${appModules.designer.path}/*`,
              },
              {
                component: Data,
                path: `${appModules.data.path}/*`,
              },
              ...(canAnalyzeRecords
                ? [
                    {
                      component: Analysis,
                      path: `${appModules.analysis.path}/*`,
                    },
                  ]
                : []),
              {
                component: Users,
                path: `${appModules.users.path}/*`,
              },
              {
                component: Help,
                path: `${appModules.help.path}/*`,
              },
            ]}
          />
        </div>
      </div>

      <JobMonitor />
      <ServiceErrors />
    </>
  )
}

export default AppView
