import './SideBar.scss'

import { useRef } from 'react'
import { useLocation } from 'react-router'

import { AppIcon } from '@webapp/components/AppIcon'
import { SidebarActions, useIsSidebarOpened } from '@webapp/service/storage/sidebar'
import { useIsSurveyDirty, useSurveyInfo } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

import Modules from './Modules'
import Version from './Version'

const SideBar = () => {
  const { pathname } = useLocation()
  const user = useUser()
  const surveyInfo = useSurveyInfo()
  const surveyIsDirty = useIsSurveyDirty()
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
          <AppIcon name={isSideBarOpened ? 'arrowBack' : 'menu'} />
        </button>
      </div>
      <Modules
        user={user}
        surveyInfo={surveyInfo}
        surveyIsDirty={surveyIsDirty}
        pathname={pathname}
        sideBarOpened={isSideBarOpened}
      />

      {isSideBarOpened && <Version />}
    </div>
  )
}

export default SideBar
