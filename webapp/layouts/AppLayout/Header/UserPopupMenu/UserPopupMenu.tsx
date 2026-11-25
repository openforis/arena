import './UserPopupMenu.scss'

import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router'

import * as User from '@core/user/user'
import { appModuleUri, homeModules, userModules } from '@webapp/app/appModules'
import ProfilePicture from '@webapp/components/ProfilePicture'
import { useAppDispatch } from '@webapp/store'
import { LoginActions } from '@webapp/store/login'
import { useI18n } from '@webapp/store/system'
import { useUser } from '@webapp/store/user'
import {
  useAuthCanCreateSurvey,
  useAuthCanCreateTemplate,
  useAuthCanEditTemplates,
  useOnNewSurveyClick,
} from '@webapp/store/user/hooks'
import { clickedOutside } from '@webapp/utils/domUtils'
import { TestId } from '@webapp/utils/testId'

const Separator = () => <div className="user-popup-menu__sep" />

type PopupMenuButtonProps = {
  onClick: (...args: any[]) => any
  iconClassName: string
  label: string
  testId?: string
}

const PopupMenuButton = (props: PopupMenuButtonProps) => {
  const i18n = useI18n()
  const { onClick, iconClassName, label, testId } = props
  return (
    <button data-testid={testId} type="button" className="btn-s btn-transparent" onClick={onClick}>
      <span className={`icon ${iconClassName} icon-12px icon-left`} />
      {i18n.t(label)}
    </button>
  )
}

type UserPopupMenuProps = {
  onClose: (...args: any[]) => any
  onQrCodeLoginDialogOpen: (...args: any[]) => any
}

const UserPopupMenu = (props: UserPopupMenuProps) => {
  const { onClose, onQrCodeLoginDialogOpen } = props

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const i18n = useI18n()
  const elementRef = useRef(null)

  const user = useUser()
  const canCreateSurvey = useAuthCanCreateSurvey()
  const canCreateTemplate = useAuthCanCreateTemplate()
  const canEditTemplates = useAuthCanEditTemplates()
  const onNewSurveyClick = useOnNewSurveyClick({ onAfterClick: onClose })

  useEffect(() => {
    const onClickListener = (e) => {
      if (elementRef.current && clickedOutside(elementRef.current, e)) {
        onClose()
      }
    }

    window.addEventListener('click', onClickListener)

    return () => {
      window.removeEventListener('click', onClickListener)
    }
  }, [onClose])

  return (
    <div className="user-popup-menu" ref={elementRef} onMouseLeave={onClose}>
      <div className="user-popup-menu__user">
        <ProfilePicture userUuid={User.getUuid(user)} />

        <div className="user-details">
          <div>{User.getName(user)}</div>
          <div>
            <Link
              className="btn-s btn-transparent"
              data-testid={TestId.header.userProfileBtn}
              to={appModuleUri(userModules.user)}
              onClick={onClose}
            >
              <span className="icon icon-user icon-12px icon-left" />
              {i18n.t('header.myProfile')}
            </Link>
          </div>
        </div>
      </div>

      <Separator />

      <Link
        data-testid={TestId.header.surveyListBtn}
        to={appModuleUri(homeModules.surveyList)}
        onClick={onClose}
        className="btn-s btn-transparent"
      >
        <span className="icon icon-paragraph-justify icon-12px icon-left" />
        {i18n.t('appModules.surveys')}
      </Link>

      {canCreateSurvey && (
        <Link
          data-testid={TestId.header.surveyCreateBtn}
          to={appModuleUri(homeModules.surveyNew)}
          onClick={onNewSurveyClick}
          className="btn-s btn-transparent"
        >
          <span className="icon icon-plus icon-12px icon-left" />
          {i18n.t('surveyCreate:newSurvey')}
        </Link>
      )}

      {(canEditTemplates || canCreateTemplate) && (
        <>
          <Separator />
          {canEditTemplates && (
            <Link
              data-testid={TestId.header.templateListBtn}
              to={appModuleUri(homeModules.templateList)}
              onClick={onClose}
              className="btn-s btn-transparent"
            >
              <span className="icon icon-paragraph-justify icon-12px icon-left" />
              {i18n.t('appModules.templates')}
            </Link>
          )}
          {canCreateTemplate && (
            <Link
              data-testid={TestId.header.templateCreateBtn}
              to={appModuleUri(homeModules.templateNew)}
              onClick={onClose}
              className="btn-s btn-transparent"
            >
              <span className="icon icon-plus icon-12px icon-left" />
              {i18n.t('surveyCreate:newTemplate')}
            </Link>
          )}
        </>
      )}

      <Separator />

      <PopupMenuButton
        iconClassName="icon-qrcode"
        label="header.qrCodeLoginDialog.title"
        onClick={onQrCodeLoginDialogOpen}
      />
      <Separator />

      <PopupMenuButton
        testId={TestId.header.userLogoutBtn}
        iconClassName="icon-switch"
        label="sidebar.logout"
        onClick={() => {
          onClose()
          dispatch(LoginActions.logout({ navigate }))
        }}
      />
    </div>
  )
}

export default UserPopupMenu
