import './appSideBar.scss'

import React, { useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router'

import * as ProcessUtils from '@core/processUtils'

import { useSurveyInfo } from '@webapp/store/survey'
import { useUser } from '@webapp/components/hooks'

import * as SideBarState from './appSidebarState'

import AppSideBarModules from './components/appSideBarModules'

import { toggleSideBar } from './actions'

const AppSideBar = () => {
  const dispatch = useDispatch()
  const { pathname } = useLocation()
  const user = useUser()
  const surveyInfo = useSurveyInfo()
  const isSideBarOpened = useSelector(SideBarState.isOpened)
  const element = useRef(null)

  return (
    <div className={`app-sidebar ${isSideBarOpened ? 'opened' : ''}`} ref={element}>
      {/* toggle sidebar */}
      <a
        className="app-sidebar__btn-toggle"
        onClick={() => {
          element.current.classList.toggle('opened')
          dispatch(toggleSideBar())
        }}
      >
        <span className="icon icon-16px icon-menu" />
      </a>

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
