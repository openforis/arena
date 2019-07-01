import './appSideBar.scss'

import React, { useState, useRef } from 'react'
import { connect } from 'react-redux'

import AppSideBarModules from './appSideBarModules'

import { logout } from '../../app/actions'

import * as SurveyState from '../../survey/surveyState'
import useI18n from '../../commonComponents/useI18n'

const AppSideBar = (props) => {

  const { pathname, surveyInfo, logout } = props

  const [opened, setOpened] = useState(false)
  const element = useRef(null)

  const i18n = useI18n()

  const toggleOpen = () => {
    element.current.classList.toggle('opened')
    setOpened(!opened)

    //react-grid-layout re-render
    // window.dispatchEvent(new Event('resize'))
  }

  return (
    <div className="app-sidebar" ref={element}>

      {/*logo placeholder*/}
      <div></div>


      <AppSideBarModules
        pathname={pathname}
        surveyInfo={surveyInfo}
        sideBarOpened={opened}/>

      {/*logout */}
      <div>
        <a className="app-sidebar__module-btn text-uppercase"
           onClick={() => logout()}>
            <span
              className={`icon icon-exit ${opened ? ' icon-left' : ''}`}
              style={{ transform: 'scaleX(-1)' }}/>
          {
            opened
              ? <span>{i18n.t('sidebar.logout')}</span>
              : null
          }
        </a>

      </div>

      {/*toggle sidebar */}
      <div>
        <a className="app-sidebar__btn-toggle"
           onClick={() => toggleOpen()}>
          <span className="icon icon-16px icon-menu"/>
        </a>
      </div>

    </div>
  )

}

const mapStateToProps = state => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
})

export default connect(mapStateToProps, { logout })(AppSideBar)