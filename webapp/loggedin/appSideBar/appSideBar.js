import './appSideBar.scss'

import React, { useRef } from 'react'
import { connect } from 'react-redux'

import AppSideBarModules from './components/appSideBarModules'

import * as AppState from '../../app/appState'
import * as SurveyState from '../../survey/surveyState'

import { toggleSideBar } from '../../app/actions'

const AppSideBar = (props) => {

  const {
    pathname, surveyInfo, isSideBarOpened,
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
        surveyInfo={surveyInfo}
        pathname={pathname}
        sideBarOpened={isSideBarOpened}/>

      {/*logout */}
      {/*<div>*/}
      {/*  <a className="app-sidebar__module-btn text-uppercase"*/}
      {/*     onClick={() => logout()}>*/}
      {/*      <span*/}
      {/*        className={`icon icon-exit ${isSideBarOpened ? ' icon-left' : ''}`}*/}
      {/*        style={{ transform: 'scaleX(-1)' }}/>*/}
      {/*    {*/}
      {/*      isSideBarOpened*/}
      {/*        ? <span>{i18n.t('sidebar.logout')}</span>*/}
      {/*        : null*/}
      {/*    }*/}
      {/*  </a>*/}

      {/*</div>*/}

    </div>
  )

}

const mapStateToProps = state => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
  isSideBarOpened: AppState.isSideBarOpened(state),
})

export default connect(mapStateToProps, { toggleSideBar })(AppSideBar)