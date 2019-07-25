import './userListView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import Authorizer from '../../../../../common/auth/authorizer'

import TablePaginator from '../../../../commonComponents/table/tablePaginator'
import useI18n from '../../../../commonComponents/useI18n'

import { appModuleUri, userModules } from '../../../appModules'

import { initUserList, fetchUsers } from '../actions'

import * as AppState from '../../../../app/appState'
import * as UsersState from '../usersState'
import * as SurveyState from '../../../../survey/surveyState'


const SurveyListView = props => {
  const { users, offset, limit, count, initUserList, fetchUsers, canInvite } = props

  const i18n = useI18n()

  useEffect(() => { initUserList() }, [])

  return (
    <div className="user-list table">
      <div className="table__header">

        <div>
          {canInvite && (
            <Link to={appModuleUri(userModules.userInvite)} className="btn btn-s">
              <span className="icon icon-plus icon-12px icon-left" />
              {i18n.t('usersView.inviteUser')}
            </Link>
          )}
        </div>

        <TablePaginator
          offset={offset}
          limit={limit}
          count={count}
          fetchFn={fetchUsers}/>
      </div>

      <div className="table__row-header">
        <div>{i18n.t('common.name')}</div>
        <div>{i18n.t('common.email')}</div>
        <div>{i18n.t('common.group')}</div>
        <div>{i18n.t('usersView.accepted')}</div>
      </div>


      <div className="table__rows">
        {
          users
            .map(user => (
              <div key={user.id} className={`table__row`}>
                <div>{user.name}</div>
                <div>{user.email}</div>
                <div>{i18n.t(`authGroups.${user.groupName}.label`)}</div>
                <div>{user.accepted ? i18n.t('common.yes') : i18n.t('common.no')}</div>
              </div>
            ))
        }
      </div>
    </div>
  )
}

const mapStateToProps = state => {
  const user = AppState.getUser(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)

  return {
    canInvite: Authorizer.canInviteUsers(user, surveyInfo),

    users: UsersState.getList(state),
    offset: UsersState.getOffset(state),
    limit: UsersState.getLimit(state),
    count: UsersState.getCount(state),
  }
}

export default connect(
  mapStateToProps,
  { initUserList, fetchUsers }
)(SurveyListView)
