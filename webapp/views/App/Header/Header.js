import './Header.scss'

import React, { useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import * as User from '@core/user/user'
import * as Survey from '@core/survey/survey'

import { useIsAppSaving } from '@webapp/store/app'
import { useSurveyCycleKey, useSurveyInfo } from '@webapp/store/survey'
import { useLang } from '@webapp/store/system'
import { useAuthCanEditSurvey, UserActions, useUser } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { appModuleUri, homeModules } from '@webapp/app/appModules'

import { usePrevious } from '@webapp/components/hooks'
import ProfilePicture from '@webapp/components/profilePicture'
import ProgressBar from '@webapp/components/progressBar'
import ButtonPublishSurvey from '@webapp/components/buttonPublishSurvey'
import { SurveyPreferredLanguageSelector } from '@webapp/components/survey/SurveyPreferredLanguageSelector'
import CycleSelector from '@webapp/components/survey/CycleSelector'

import UserPopupMenu from './UserPopupMenu'
import { Breadcrumbs } from './Breadcrumbs'
import { useIsSidebarOpened } from '@webapp/service/storage/sidebar'

const Header = () => {
  const dispatch = useDispatch()
  const user = useUser()
  const lang = useLang()
  const appSaving = useIsAppSaving()
  const isSideBarOpen = useIsSidebarOpened()
  const surveyInfo = useSurveyInfo()
  const surveyCycleKey = useSurveyCycleKey()
  const canEditSurvey = useAuthCanEditSurvey()

  const [showUserPopup, setShowUserPopup] = useState(false)
  const toggleShowUserPopup = () => setShowUserPopup((showUserPopupPrev) => !showUserPopupPrev)

  const prevUser = usePrevious(user)
  const pictureUpdateKeyRef = useRef(0)

  pictureUpdateKeyRef.current += prevUser !== user

  return (
    <div className={classNames('header', { 'sidebar-open': isSideBarOpen })}>
      <div className="header__logo">
        <a href="https://www.openforis.org" target="_blank" rel="noopener noreferrer" className="flex-center">
          <img src="/img/of_icon.png" alt="Open Foris" />
        </a>
      </div>

      <Breadcrumbs />

      <div className="header__survey">
        {Survey.isValid(surveyInfo) &&
          (appSaving ? (
            <ProgressBar className="progress-bar-striped" progress={100} showText={false} />
          ) : (
            <>
              <Link
                data-testid={TestId.header.surveyTitle}
                to={appModuleUri(homeModules.surveyInfo)}
                className="btn-s btn-transparent"
              >
                <div className="header__survey-title">{Survey.getLabel(surveyInfo, lang)}</div>
              </Link>
              <CycleSelector
                selectedCycle={surveyCycleKey}
                onChange={(cycle) => {
                  const surveyId = Survey.getIdSurveyInfo(surveyInfo)
                  const userUpdated = User.assocPrefSurveyCycle(surveyId, cycle)(user)
                  dispatch(UserActions.updateUserPrefs({ user: userUpdated }))
                }}
              />
              <SurveyPreferredLanguageSelector />
              {canEditSurvey && Survey.isDraft(surveyInfo) && <ButtonPublishSurvey className="btn-secondary" />}
            </>
          ))}
      </div>

      {/* Placeholder to make the header symmetric */}
      <div></div>

      <button
        className="header__btn-user"
        data-testid={TestId.header.userBtn}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          toggleShowUserPopup()
        }}
        onKeyDown={toggleShowUserPopup}
        tabIndex="0"
        type="button"
      >
        <ProfilePicture userUuid={User.getUuid(user)} forceUpdateKey={pictureUpdateKeyRef.current} thumbnail />
        <span className="icon icon-ctrl" />
      </button>

      {showUserPopup && <UserPopupMenu onClose={() => setShowUserPopup(false)} />}
    </div>
  )
}

export default Header
