import './Header.scss'

import React, { useRef, useState } from 'react'
import { useDispatch } from 'react-redux'

import * as User from '@core/user/user'
import * as Survey from '@core/survey/survey'

import { useIsAppSaving } from '@webapp/store/app'
import { useSurveyCycleKey, useSurveyInfo } from '@webapp/store/survey'
import { useLang } from '@webapp/store/system'
import { UserActions, useUser } from '@webapp/store/user'
import { DataTestId } from '@webapp/utils/dataTestId'

import { usePrevious } from '@webapp/components/hooks'
import ProfilePicture from '@webapp/components/profilePicture'
import ProgressBar from '@webapp/components/progressBar'
import ButtonPublishSurvey from '@webapp/components/buttonPublishSurvey'

import UserPopupMenu from './UserPopupMenu'
import CycleSelector from './CycleSelector'

const Header = () => {
  const dispatch = useDispatch()
  const user = useUser()
  const lang = useLang()
  const appSaving = useIsAppSaving()
  const surveyInfo = useSurveyInfo()
  const surveyCycleKey = useSurveyCycleKey()

  const [showUserPopup, setShowUserPopup] = useState(false)
  const toggleShowUserPopup = () => setShowUserPopup((showUserPopupPrev) => !showUserPopupPrev)

  const prevUser = usePrevious(user)
  const pictureUpdateKeyRef = useRef(0)

  pictureUpdateKeyRef.current += prevUser !== user

  return (
    <div className="header">
      <div className="header__logo">
        <a href="http://www.openforis.org" target="_blank" rel="noopener noreferrer" className="flex-center">
          <img src="/img/of_icon.png" alt="Open Foris" />
        </a>
      </div>

      <div className="header__survey">
        {Survey.isValid(surveyInfo) &&
          (appSaving ? (
            <ProgressBar className="running progress-bar-striped" progress={100} showText={false} />
          ) : (
            <>
              <div className="header__survey-title">
                {Survey.getName(surveyInfo)} - {Survey.getLabel(surveyInfo, lang)}
              </div>
              <CycleSelector
                surveyInfo={surveyInfo}
                surveyCycleKey={surveyCycleKey}
                onChange={(cycle) => {
                  const surveyId = Survey.getIdSurveyInfo(surveyInfo)
                  const userUpdated = User.assocPrefSurveyCycle(surveyId, cycle)(user)
                  dispatch(UserActions.updateUserPrefs({ user: userUpdated }))
                }}
              />
              {Survey.isDraft(surveyInfo) && !Survey.isTemplate(surveyInfo) && (
                <ButtonPublishSurvey className="btn-secondary" />
              )}
            </>
          ))}
      </div>

      <button
        className="header__btn-user"
        data-testid={DataTestId.header.userBtn}
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
