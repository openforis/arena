import './AppView.scss'

import React, { useEffect, useMemo } from 'react'
import classNames from 'classnames'

import { appModules } from '@webapp/app/appModules'
import { AppReducer, AppState } from '@webapp/store/app'
import { injectReducers } from '@webapp/store'

import { useAuthCanUseAnalysis, useAuthCanUseMessages } from '@webapp/store/user'
import { useIsSidebarOpened } from '@webapp/service/storage/sidebar'
import ModuleSwitch from '@webapp/components/moduleSwitch'

import Header from './Header'
import JobMonitor from './JobMonitor'
import { FileUploadDialog } from './FileUploadDialog'
import ServiceErrors from './ServiceErrors'
import SideBar from './SideBar'

const Analysis = React.lazy(() => import('./views/Analysis'))
const Data = React.lazy(() => import('./views/Data'))
const Designer = React.lazy(() => import('./views/Designer'))
const Home = React.lazy(() => import('./views/Home'))
const Users = React.lazy(() => import('./views/Users'))
const Message = React.lazy(() => import('./views/Message'))
const Help = React.lazy(() => import('./views/Help'))

const AppView = () => {
  useEffect(() => {
    injectReducers(AppState.stateKey, AppReducer)
  }, [])

  const isSideBarOpen = useIsSidebarOpened()
  const canAnalyzeRecords = useAuthCanUseAnalysis()
  const canUseMessages = useAuthCanUseMessages()

  const modules = useMemo(() => {
    const result = [
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
    ]
    if (canAnalyzeRecords) {
      result.push({
        component: Analysis,
        path: `${appModules.analysis.path}/*`,
      })
    }
    result.push({
      component: Users,
      path: `${appModules.users.path}/*`,
    })
    if (canUseMessages) {
      result.push({ component: Message, path: `${appModules.messages.path}/*` })
    }
    result.push({
      component: Help,
      path: `${appModules.help.path}/*`,
    })
    return result
  }, [canAnalyzeRecords, canUseMessages])

  return (
    <>
      <Header />

      <div className="app__container">
        <SideBar />
        <div className={classNames('app-module', { 'sidebar-open': isSideBarOpen })}>
          <ModuleSwitch moduleDefault={appModules.home} modules={modules} />
        </div>
      </div>

      <JobMonitor />
      <FileUploadDialog />
      <ServiceErrors />
    </>
  )
}

export default AppView
