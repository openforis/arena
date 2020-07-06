import './SideBar.scss'

import React, { useRef } from 'react'
import { useLocation } from 'react-router'

import { SidebarActions, useIsSidebarOpened } from '@webapp/service/storage/sidebar'
import { useSurveyInfo } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

import Version from './Version'
import Modules from './Modules'

const SideBar = () => {
  const { pathname } = useLocation()
  const user = useUser()
  const surveyInfo = useSurveyInfo()
  const isSideBarOpened = useIsSidebarOpened()
  const element = useRef(null)

  return (
    <div className={`sidebar ${isSideBarOpened ? 'opened' : ''}`} ref={element}>
      <button type="button" className="btn-transparent sidebar__btn-toggle" onClick={SidebarActions.toggleSidebar}>
        <span className="icon icon-16px icon-menu" />
      </button>

      <Modules user={user} surveyInfo={surveyInfo} pathname={pathname} sideBarOpened={isSideBarOpened} />

      {isSideBarOpened && <Version />}
    </div>
  )
}

export default SideBar
