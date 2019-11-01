import './appSideBar.scss'

import React, { useRef } from 'react'
import { connect } from 'react-redux'

import * as ProcessUtils from '@core/processUtils'
import AppSideBarModules from './components/appSideBarModules'

import * as AppState from '@webapp/app/appState'
import * as SideBarState from './appSidebarState'
import * as SurveyState from '@webapp/survey/surveyState'

import { toggleSideBar } from './actions'

const AppSideBar = (props) => {

  const {
    pathname,
    user, surveyInfo, isSideBarOpened,
    toggleSideBar
  } = props

  const element = useRef(null)

  return (
    <div className={`app-sidebar ${isSideBarOpened ? 'opened' : ''}`} ref={element}>
      {/*toggle sidebar */}
      <a className="app-sidebar__btn-toggle"
         onClick={() => {
           element.current.classList.toggle('opened')
           toggleSideBar()
         }}>
        <span className="icon icon-16px icon-menu"/>
      </a>

      <AppSideBarModules
        user={user}
        surveyInfo={surveyInfo}
        pathname={pathname}
        sideBarOpened={isSideBarOpened}/>

      <div
        class="app-version"
        data-commit-hash={ProcessUtils.ENV.gitCommithash}
        data-branch={ProcessUtils.ENV.gitBranch}
        data-package-version={ProcessUtils.ENV.packageVersion}
      >
        {isSideBarOpened && `OpenForis Arena version ${ProcessUtils.ENV.applicationVersion}`}
      </div>

    </div>
  )

}

const mapStateToProps = state => ({
  user: AppState.getUser(state),
  surveyInfo: SurveyState.getSurveyInfo(state),
  isSideBarOpened: SideBarState.isOpened(state),
})

export default connect(mapStateToProps, { toggleSideBar })(AppSideBar)