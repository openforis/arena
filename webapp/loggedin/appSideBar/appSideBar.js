import './appSideBar.scss'

import React, {useRef} from 'react'
import {connect} from 'react-redux'

import * as ProcessUtils from '@core/processUtils'
import {useI18n} from '@webapp/commonComponents/hooks'

import * as AppState from '@webapp/app/appState'
import * as SurveyState from '@webapp/survey/surveyState'
import * as SideBarState from './appSidebarState'
import AppSideBarModules from './components/appSideBarModules'

import {toggleSideBar} from './actions'

const AppSideBar = props => {
  const {pathname, user, surveyInfo, isSideBarOpened, toggleSideBar} = props

  const element = useRef(null)

  const i18n = useI18n()

  return (
    <div
      className={`app-sidebar ${isSideBarOpened ? 'opened' : ''}`}
      ref={element}
    >
      {/* toggle sidebar */}
      <a
        className="app-sidebar__btn-toggle"
        onClick={() => {
          element.current.classList.toggle('opened')
          toggleSideBar()
        }}
      >
        <span className="icon icon-16px icon-menu" />
      </a>

      <AppSideBarModules
        user={user}
        surveyInfo={surveyInfo}
        pathname={pathname}
        sideBarOpened={isSideBarOpened}
      />

      {isSideBarOpened && (
        <div
          className="app-version"
          data-commit-hash={ProcessUtils.ENV.gitCommitHash}
          data-branch={ProcessUtils.ENV.gitBranch}
        >
          OpenForis Arena
          <br />
          {`${i18n.t('common.version')} ${ProcessUtils.ENV.applicationVersion}`}
        </div>
      )}
    </div>
  )
}

const mapStateToProps = state => ({
  user: AppState.getUser(state),
  surveyInfo: SurveyState.getSurveyInfo(state),
  isSideBarOpened: SideBarState.isOpened(state),
})

export default connect(mapStateToProps, {toggleSideBar})(AppSideBar)
