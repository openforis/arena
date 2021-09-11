import './UserPopupMenu.scss'

import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import * as User from '@core/user/user'

import { clickedOutside } from '@webapp/utils/domUtils'

import { LoginActions } from '@webapp/store/login'
import { useI18n } from '@webapp/store/system'
import { useUser } from '@webapp/store/user'

import { appModuleUri, homeModules, userModules } from '@webapp/app/appModules'
import ProfilePicture from '@webapp/components/profilePicture'

import {
  useAuthCanCreateSurvey,
  useAuthCanCreateTemplate,
  useAuthCanEditTemplates,
  useAuthCanViewUsersAccessRequests,
} from '@webapp/store/user/hooks'
import { DataTestId } from '@webapp/utils/dataTestId'

const Separator = () => <div className="user-popup-menu__sep" />

const UserPopupMenu = (props) => {
  const { onClose } = props

  const dispatch = useDispatch()
  const i18n = useI18n()
  const elementRef = useRef(null)

  const user = useUser()
  const canCreateSurvey = useAuthCanCreateSurvey()
  const canCreateTemplate = useAuthCanCreateTemplate()
  const canEditTemplates = useAuthCanEditTemplates()
  const canViewUsersAccessRequests = useAuthCanViewUsersAccessRequests()

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
  }, [])

  return (
    <div className="user-popup-menu" ref={elementRef} onMouseLeave={onClose}>
      <div className="user-popup-menu__user">
        <ProfilePicture userUuid={User.getUuid(user)} />

        <div className="user-details">
          <div>{User.getName(user)}</div>
          <div>
            <Link
              className="btn-s btn-transparent"
              data-testid={DataTestId.header.userProfileBtn}
              to={`${appModuleUri(userModules.user)}${User.getUuid(user)}/`}
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
        data-testid={DataTestId.header.surveyListBtn}
        to={appModuleUri(homeModules.surveyList)}
        onClick={onClose}
        className="btn-s btn-transparent"
      >
        <span className="icon icon-paragraph-justify icon-12px icon-left" />
        {i18n.t('appModules.surveyList')}
      </Link>

      {canCreateSurvey && (
        <Link
          data-testid={DataTestId.header.surveyCreateBtn}
          to={appModuleUri(homeModules.surveyNew)}
          onClick={onClose}
          className="btn-s btn-transparent"
        >
          <span className="icon icon-plus icon-12px icon-left" />
          {i18n.t('homeView.surveyCreate.newSurvey')}
        </Link>
      )}

      {(canEditTemplates || canCreateTemplate) && (
        <>
          <Separator />
          {canEditTemplates && (
            <Link
              data-testid={DataTestId.header.templateListBtn}
              to={appModuleUri(homeModules.templateList)}
              onClick={onClose}
              className="btn-s btn-transparent"
            >
              <span className="icon icon-paragraph-justify icon-12px icon-left" />
              {i18n.t('appModules.templateList')}
            </Link>
          )}
          {canCreateTemplate && (
            <Link
              data-testid={DataTestId.header.templateCreateBtn}
              to={appModuleUri(homeModules.templateNew)}
              onClick={onClose}
              className="btn-s btn-transparent"
            >
              <span className="icon icon-plus icon-12px icon-left" />
              {i18n.t('homeView.surveyCreate.newTemplate')}
            </Link>
          )}
        </>
      )}

      {canViewUsersAccessRequests && (
        <>
          <Separator />
          <Link
            data-testid={DataTestId.header.usersAccessRequstsBtn}
            to={appModuleUri(userModules.usersAccessRequest)}
            onClick={onClose}
            className="btn-s btn-transparent"
          >
            <span className="icon icon-paragraph-justify icon-12px icon-left" />
            {i18n.t('appModules.usersAccessRequests')}
          </Link>
        </>
      )}

      <Separator />

      <button
        data-testid={DataTestId.header.userLogoutBtn}
        type="button"
        className="btn-s btn-transparent"
        onClick={() => {
          onClose()
          dispatch(LoginActions.logout())
        }}
      >
        <span className="icon icon-switch icon-12px icon-left" />
        {i18n.t('sidebar.logout')}
      </button>
    </div>
  )
}

UserPopupMenu.propTypes = {
  onClose: PropTypes.func,
}

UserPopupMenu.defaultProps = {
  onClose: () => ({}),
}

export default UserPopupMenu
