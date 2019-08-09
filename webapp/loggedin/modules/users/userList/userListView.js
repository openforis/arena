import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import TableView from '../../../tableViews/tableView'
import useI18n from '../../../../commonComponents/useI18n'

import Authorizer from '../../../../../common/auth/authorizer'

import User from '../../../../../common/user/user'

import { appModuleUri, userModules } from '../../../appModules'

import * as AppState from '../../../../app/appState'
import * as SurveyState from '../../../../survey/surveyState'

const UsersHeaderLeft = props => {
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
      <div>{i18n.t('common.name')}</div>
      <div>{i18n.t('common.email')}</div>
      <div>{i18n.t('common.group')}</div>
      <div>{i18n.t('usersView.accepted')}</div>
    </>
  )
}

const UsersRow = props => {
  const { row: user } = props
  const i18n = useI18n()

  return (
    <>
      <div>
        {User.getName(user)}
      </div>
      <div>
        {User.getEmail(user)}
      </div>
      <div>
        {i18n.t(`authGroups.${User.getGroupName(user)}.label`)}
      </div>
      <div>
        {
          User.hasAccepted(user) &&
          <span className="icon icon-user-check icon-16px"/>
        }
      </div>
    </>
  )
}

const UsersListView = ({ canInvite }) => (
  <TableView
    module={'users'}
    className="records"
    gridTemplateColumns={'repeat(4, 1fr)'}
    headerLeftComponent={UsersHeaderLeft}
    rowHeaderComponent={UsersRowHeader}
    rowComponent={UsersRow}

    canInvite={canInvite}
  />
)

const mapStateToProps = state => {
  const user = AppState.getUser(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)

  return {
    canInvite: Authorizer.canInviteUsers(user, surveyInfo),
  }
}

export default connect(mapStateToProps)(UsersListView)
