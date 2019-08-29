import './userListView.scss'

import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import TableView from '../../../tableViews/tableView'
import useI18n from '../../../../commonComponents/useI18n'

import Authorizer from '../../../../../common/auth/authorizer'

import User from '../../../../../common/user/user'
import AuthGroups from '../../../../../common/auth/authGroups'

import { appModuleUri, userModules } from '../../../appModules'

import * as AppState from '../../../../app/appState'
import * as SurveyState from '../../../../survey/surveyState'

const UsersHeaderLeft = props => {
  const i18n = useI18n()
  const { canInvite } = props

  return (
    <div>
      {canInvite && (
        <Link to={appModuleUri(userModules.user)} className="btn btn-s">
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
      <div>{i18n.t('common.name')}</div>
      <div>{i18n.t('common.email')}</div>
      <div>{i18n.t('common.group')}</div>
      <div>{i18n.t('usersView.accepted')}</div>
    </>
  )
}

const UsersRow = props => {
  const { row: userListItem, user, surveyInfo } = props
  const i18n = useI18n()

  const authGroup = Authorizer.getSurveyUserGroup(userListItem, surveyInfo)
  const canEditUser = Authorizer.canEditUser(user, surveyInfo, userListItem)

  return (
    <>
      <div>
        {User.getName(userListItem)}
      </div>
      <div>
        {User.getEmail(userListItem)}
      </div>
      <div>
        {i18n.t(`authGroups.${AuthGroups.getName(authGroup)}.label`)}
      </div>
      <div>
        {
          User.hasAccepted(userListItem) &&
          <span className="icon icon-user-check icon-16px"/>
        }
      </div>
      <div>
        <span className={`icon icon-12px ${canEditUser ? 'icon-pencil2' : 'icon-eye'}`}/>
      </div>
    </>
  )
}

const UsersListView = ({ canInvite, user, surveyInfo, history }) => {
  const onRowClick = user => history.push(`${appModuleUri(userModules.user)}${User.getUuid(user)}`)

  return <TableView
    module={'users'}
    className="users-list"
    gridTemplateColumns={'repeat(3, 1fr) 10rem 50px'}
    headerLeftComponent={UsersHeaderLeft}
    rowHeaderComponent={UsersRowHeader}
    rowComponent={UsersRow}

    canInvite={canInvite}
    user={user}
    surveyInfo={surveyInfo}

    onRowClick={onRowClick}
  />
}

const mapStateToProps = state => {
  const user = AppState.getUser(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)

  return {
    user,
    surveyInfo,
    canInvite: Authorizer.canInviteUsers(user, surveyInfo),
  }
}

export default connect(mapStateToProps)(UsersListView)
