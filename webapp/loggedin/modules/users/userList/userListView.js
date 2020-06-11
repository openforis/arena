import './userListView.scss'

import React from 'react'
import PropTypes from 'prop-types'
import { Link, useHistory } from 'react-router-dom'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import { appModuleUri, userModules } from '@webapp/app/appModules'

import { useI18n } from '@webapp/store/system'
import { useAuthCanEditUser, useAuthCanInviteUser } from '@webapp/store/user'
import { useSurveyInfo } from '@webapp/store/survey'

import ProfilePicture from '@webapp/components/profilePicture'
import Table from '@webapp/components/Table/Table'

const UsersHeaderLeft = () => {
  const i18n = useI18n()
  const canInvite = useAuthCanInviteUser()

  return (
    <div>
      {canInvite && (
        <Link to={appModuleUri(userModules.userInvite)} className="btn btn-s">
          <span className="icon icon-user-plus icon-12px icon-left" />
          {i18n.t('usersView.inviteUser')}
        </Link>
      )}
    </div>
  )
}

const UsersRowHeader = () => {
  const i18n = useI18n()
  return (
    <>
      <div />
      <div>{i18n.t('common.name')}</div>
      <div>{i18n.t('common.email')}</div>
      <div>{i18n.t('common.group')}</div>
      <div>{i18n.t('usersView.accepted')}</div>
    </>
  )
}

const UsersRow = (props) => {
  const { row: userListItem } = props
  const surveyInfo = useSurveyInfo()
  const i18n = useI18n()
  const canEditUser = useAuthCanEditUser(userListItem)

  const authGroup = User.getAuthGroupBySurveyUuid(Survey.getUuid(surveyInfo))(userListItem)

  return (
    <>
      <div className="users-list__cell-profile-picture">
        <ProfilePicture userUuid={User.getUuid(userListItem)} thumbnail />
      </div>
      <div>{User.getName(userListItem)}</div>
      <div>{User.getEmail(userListItem)}</div>
      <div>{i18n.t(`authGroups.${AuthGroup.getName(authGroup)}.label_plural`)}</div>
      <div>
        {User.hasAccepted(userListItem) && <span className="icon icon-user-check icon-16px" />}
        {User.isInvited(userListItem) && User.isInvitationExpired(userListItem) && (
          <span className="icon icon-crying icon-16px icon-invitation-expired" />
        )}
      </div>
      <div>
        <span className={`icon icon-12px icon-action ${canEditUser ? 'icon-pencil2' : 'icon-eye'}`} />
      </div>
    </>
  )
}

UsersRow.propTypes = {
  row: PropTypes.object.isRequired,
}

const UsersListView = () => {
  const history = useHistory()
  const onRowClick = (user) => history.push(`${appModuleUri(userModules.user)}${User.getUuid(user)}`)

  return (
    <Table
      module="users"
      className="users-list"
      gridTemplateColumns={'35px repeat(3, 1fr) 10rem 50px'}
      headerLeftComponent={UsersHeaderLeft}
      rowHeaderComponent={UsersRowHeader}
      rowComponent={UsersRow}
      onRowClick={onRowClick}
    />
  )
}

export default UsersListView
