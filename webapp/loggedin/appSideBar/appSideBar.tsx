import './appSideBar.scss'

import React, { useRef } from 'react'
import { connect } from 'react-redux'

import AppSideBarModules from './components/appSideBarModules'

import * as AppState from '../../app/appState'
import * as SurveyState from '../../survey/surveyState'

import { toggleSideBar } from '../../app/actions'

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

    </div>
  )

}

const mapStateToProps = state => ({
  user: AppState.getUser(state),
  surveyInfo: SurveyState.getSurveyInfo(state),
  isSideBarOpened: AppState.isSideBarOpened(state),
})

export default connect(mapStateToProps, { toggleSideBar })(AppSideBar)
