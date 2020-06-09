import './userListView.scss'

import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import ProfilePicture from '@webapp/components/profilePicture'
import { useI18n } from '@webapp/store/system'

import * as AuthGroup from '@core/auth/authGroup'
import * as Authorizer from '@core/auth/authorizer'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import * as AppState from '@webapp/app/appState'
import { SurveyState } from '@webapp/store/survey'
import { appModuleUri, userModules } from '@webapp/app/appModules'
import TableView from '../../../tableViews/tableView'

const UsersHeaderLeft = (props) => {
  const i18n = useI18n()
  const { canInvite } = props

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
  const { row: userListItem, user, surveyInfo } = props
  const i18n = useI18n()

  const authGroup = User.getAuthGroupBySurveyUuid(Survey.getUuid(surveyInfo))(userListItem)
  const canEditUser = Authorizer.canEditUser(user, surveyInfo, userListItem)

  return (
    <>
      <div className="users-list__cell-profile-picture">
        <ProfilePicture userUuid={User.getUuid(userListItem)} thumbnail={true} />
      </div>
      <div>{User.getName(userListItem)}</div>
      <div>{User.getEmail(userListItem)}</div>
      <div>{i18n.t(`authGroups.${AuthGroup.getName(authGroup)}.label_plural`)}</div>
      <div>
        {User.hasAccepted(userListItem) ? (
          <span className="icon icon-user-check icon-16px" />
        ) : User.isInvited(userListItem) ? (
          User.isInvitationExpired(userListItem) ? (
            <span className="icon icon-crying icon-16px icon-invitation-expired" />
          ) : null
        ) : null}
      </div>
      <div>
        <span className={`icon icon-12px icon-action ${canEditUser ? 'icon-pencil2' : 'icon-eye'}`} />
      </div>
    </>
  )
}

const UsersListView = ({ canInvite, user, surveyInfo, history }) => {
  const onRowClick = (user) => history.push(`${appModuleUri(userModules.user)}${User.getUuid(user)}`)

  return (
    <TableView
      module={'users'}
      className="users-list"
      gridTemplateColumns={'35px repeat(3, 1fr) 10rem 50px'}
      headerLeftComponent={UsersHeaderLeft}
      rowHeaderComponent={UsersRowHeader}
      rowComponent={UsersRow}
      canInvite={canInvite}
      user={user}
      surveyInfo={surveyInfo}
      onRowClick={onRowClick}
    />
  )
}

const mapStateToProps = (state) => {
  const user = AppState.getUser(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)

  return {
    user,
    surveyInfo,
    canInvite: Authorizer.canInviteUsers(user, surveyInfo),
  }
}

export default connect(mapStateToProps)(UsersListView)
