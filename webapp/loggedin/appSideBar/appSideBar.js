import './appSideBar.scss'

import React, { useRef } from 'react'
import { useLocation } from 'react-router'

import * as ProcessUtils from '@core/processUtils'

import { toggleSidebar, useIsSidebarOpened } from '@webapp/service/storage'
import { useSurveyInfo } from '@webapp/store/survey'
import { useUser } from '@webapp/components/hooks'

import AppSideBarModules from './components/appSideBarModules'

const AppSideBar = () => {
  const { pathname } = useLocation()
  const user = useUser()
  const surveyInfo = useSurveyInfo()
  const isSideBarOpened = useIsSidebarOpened()
  const element = useRef(null)

  return (
    <div className={`app-sidebar ${isSideBarOpened ? 'opened' : ''}`} ref={element}>
      <button type="button" className="btn-transparent app-sidebar__btn-toggle" onClick={toggleSidebar}>
        <span className="icon icon-16px icon-menu" />
      </button>

      <AppSideBarModules user={user} surveyInfo={surveyInfo} pathname={pathname} sideBarOpened={isSideBarOpened} />

      {isSideBarOpened && (
        <div
          className="app-version"
          data-commit-hash={ProcessUtils.ENV.gitCommitHash}
          data-branch={ProcessUtils.ENV.gitBranch}
        >
          OpenForis Arena
          <br />
          {ProcessUtils.ENV.applicationVersion}
        </div>
      )}
    </div>
  )
}

export default AppSideBar
