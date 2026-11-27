import './Header.scss'

import { useCallback, useState } from 'react'
import classNames from 'classnames'
import { Link } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import { appModuleUri, homeModules } from '@webapp/app/appModules'
import { Button, Spinner } from '@webapp/components'
import { AssistantButton } from '@webapp/components/ai/Assistant'
import { AppIcon } from '@webapp/components/AppIcon'
import ButtonPublishSurvey from '@webapp/components/ButtonPublishSurvey'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import ProfilePicture from '@webapp/components/ProfilePicture'
import CycleSelector from '@webapp/components/survey/CycleSelector'
import { SurveyPreferredLanguageSelector } from '@webapp/components/survey/SurveyPreferredLanguageSelector'
import { ThemeButtonMenu } from '@webapp/components/ThemeButtonMenu'
import { useIsSidebarOpened } from '@webapp/service/storage/sidebar'
import { useAppDispatch } from '@webapp/store'
import { useIsAppSaving } from '@webapp/store/app'
import { useIsSurveyDirty, useSurveyCycleKey, useSurveyInfo, useSurveyPreferredLang } from '@webapp/store/survey'
import { useHasMessageNotifications } from '@webapp/store/ui'
import { useAuthCanEditSurvey, UserActions, useUser } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { Breadcrumbs } from './Breadcrumbs'
import { MessageNotificationPanel } from './MessageNotificationsPanel'
import { PreferredUILanguageButtonMenu } from './PreferredUILanguageButtonMenu'
import { QRCodeLoginDialog } from './QRCodeLoginDialog'
import UserPopupMenu from './UserPopupMenu'

const Header = () => {
  const dispatch = useAppDispatch()
  const user = useUser()
  const lang = useSurveyPreferredLang()
  const appSaving = useIsAppSaving()
  const isSideBarOpen = useIsSidebarOpened()
  const surveyInfo = useSurveyInfo()
  const surveyIsDirty = useIsSurveyDirty()
  const surveyCycleKey = useSurveyCycleKey()
  const canEditSurvey = useAuthCanEditSurvey()
  const hasMessageNotifications = useHasMessageNotifications()

  const [showUserPopup, setShowUserPopup] = useState(false)
  const toggleShowUserPopup = useCallback(() => setShowUserPopup((showUserPopupPrev) => !showUserPopupPrev), [])
  const [showMessageNotifications, setShowMessageNotifications] = useState(false)
  const [qrLoginDialogShown, setQrLoginDialogShown] = useState(false)

  const toggleQrLoginDialogVisible = useCallback(
    () => setQrLoginDialogShown((prevQrLoginDialogShown) => !prevQrLoginDialogShown),
    []
  )

  const toggleShowMessageNotifications = useCallback(() => setShowMessageNotifications((prev) => !prev), [])

  const onQrCodeLoginDialogOpen = useCallback(() => {
    setShowUserPopup(false)
    toggleQrLoginDialogVisible()
  }, [toggleQrLoginDialogVisible])

  const [prevUser, setPrevUser] = useState(user)
  const [pictureUpdateKey, setPictureUpdateKey] = useState(0)

  if (prevUser !== user) {
    setPrevUser(user)
    setPictureUpdateKey((k) => k + 1)
  }

  const surveyLabel = Survey.getLabel(surveyInfo, lang, false)
  const surveyName = Survey.getName(surveyInfo)
  const surveyTitle = surveyLabel ? `${surveyLabel} [${surveyName}]` : surveyName

  return (
    <div className={classNames('app-header', { 'sidebar-open': isSideBarOpen })}>
      <div className="app-header__logo">
        <a href="https://www.openforis.org" target="_blank" rel="noopener noreferrer" className="flex-center">
          <img src="/img/of_arena_icon.png" alt="Open Foris" />
        </a>
      </div>

      <Breadcrumbs />

      <div className="app-header__survey">
        {Survey.isValid(surveyInfo) && (
          <>
            <Link
              aria-disabled={surveyIsDirty}
              data-testid={TestId.header.surveyTitle}
              to={appModuleUri(homeModules.surveyInfo)}
              className="btn-s btn-transparent"
            >
              <LabelWithTooltip className="app-header__survey-title" label={surveyTitle} />
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
            <div className="app-header__loader-wrapper">{appSaving && <Spinner size={25} />}</div>
          </>
        )}
      </div>

      {/* Placeholder to make the header symmetric */}
      <div></div>

      <div className="app-header__user-controls">
        {hasMessageNotifications && (
          <>
            <Button
              iconName="notifications"
              iconSize={16}
              onClick={toggleShowMessageNotifications}
              title="common.notification_other"
              variant="text"
            />
            {showMessageNotifications && <MessageNotificationPanel onClose={toggleShowMessageNotifications} />}
          </>
        )}
        <AssistantButton />
        <ThemeButtonMenu />
        <PreferredUILanguageButtonMenu />
        <button
          className="app-header__btn-user"
          data-testid={TestId.header.userBtn}
          disabled={surveyIsDirty}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            toggleShowUserPopup()
          }}
          onKeyDown={toggleShowUserPopup}
          tabIndex={0}
          type="button"
        >
          <ProfilePicture userUuid={User.getUuid(user)} forceUpdateKey={pictureUpdateKey} thumbnail />
          <AppIcon name="dropDown" />
        </button>
      </div>
      {showUserPopup && (
        <UserPopupMenu onClose={toggleShowUserPopup} onQrCodeLoginDialogOpen={onQrCodeLoginDialogOpen} />
      )}
      {qrLoginDialogShown && <QRCodeLoginDialog onClose={toggleQrLoginDialogVisible} />}
    </div>
  )
}

export default Header
