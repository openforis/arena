import './Header.scss'

import React, { useRef, useState } from 'react'
import classNames from 'classnames'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import { appModuleUri, homeModules } from '@webapp/app/appModules'
import { Spinner } from '@webapp/components'
import ButtonPublishSurvey from '@webapp/components/buttonPublishSurvey'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import { usePrevious } from '@webapp/components/hooks'
import ProfilePicture from '@webapp/components/profilePicture'
import CycleSelector from '@webapp/components/survey/CycleSelector'
import { SurveyPreferredLanguageSelector } from '@webapp/components/survey/SurveyPreferredLanguageSelector'
import { useIsSidebarOpened } from '@webapp/service/storage/sidebar'
import { useIsAppSaving } from '@webapp/store/app'
import { useSurveyCycleKey, useSurveyInfo } from '@webapp/store/survey'
import { useLang } from '@webapp/store/system'
import { useAuthCanEditSurvey, UserActions, useUser } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { Breadcrumbs } from './Breadcrumbs'
import UserPopupMenu from './UserPopupMenu'

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

  const surveyLabel = Survey.getLabel(surveyInfo, lang, false)
  const surveyName = Survey.getName(surveyInfo)
  const surveyTitle = surveyLabel ? `${surveyLabel} [${surveyName}]` : surveyName

  return (
    <div className={classNames('header', { 'sidebar-open': isSideBarOpen })}>
      <div className="header__logo">
        <a href="https://www.openforis.org" target="_blank" rel="noopener noreferrer" className="flex-center">
          <img src="/img/of_icon.png" alt="Open Foris" />
        </a>
      </div>

      <Breadcrumbs />

      <div className="header__survey">
        {Survey.isValid(surveyInfo) && (
          <>
            <Link
              data-testid={TestId.header.surveyTitle}
              to={appModuleUri(homeModules.surveyInfo)}
              className="btn-s btn-transparent"
            >
              <LabelWithTooltip className="header__survey-title" label={surveyTitle} />
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
            <div className="header__loader-wrapper">{appSaving && <Spinner size={25} />}</div>
          </>
        )}
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
