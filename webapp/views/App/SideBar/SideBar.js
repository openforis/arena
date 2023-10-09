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
      <div className="sidebar__header">
        <button
          type="button"
          className={`btn-transparent sidebar__btn-${isSideBarOpened ? 'close' : 'open'}`}
          onClick={SidebarActions.toggleSidebar}
        >
          <span className={`icon icon-16px ${isSideBarOpened ? 'icon-arrow-left2' : 'icon-menu'}`} />
        </button>
      </div>
      <Modules user={user} surveyInfo={surveyInfo} pathname={pathname} sideBarOpened={isSideBarOpened} />

      {isSideBarOpened && <Version />}
    </div>
  )
}

export default SideBar
