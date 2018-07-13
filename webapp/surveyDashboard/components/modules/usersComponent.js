import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import DataFetchComponent from '../dataFetchComponent'

import { appState, appModules } from '../../../app/app'
import { statePaths } from '../../surveyDashboard'
import { userRoles } from '../../../../common/user/userRole'

const canInviteUsers = false

class UsersComponent extends React.Component {

  render () {
    const {users} = this.props
    const roleKeys = R.keys(users)

    const roleUsersCount = role => R.prop('count', users[role])
    const roleHasUsers = role => roleUsersCount(role) > 0
    const hasUsers = roleKeys.some(roleHasUsers)

    return (
      <DataFetchComponent module={appModules.users}>
        <div className="survey-module">

          <div className="flex-center title-of">
            <span className="icon icon-users icon-24px icon-left"/>
            <h5>Users</h5>
          </div>

          {
            hasUsers
              ? (
                <div className="survey-module-item">
                  {
                    roleKeys.map(
                      role => roleHasUsers(role)
                        ? <div key={role}>{roleUsersCount(role)} {role}</div>
                        : null
                    )
                  }
                  <button className="btn btn-of">
                    <span className="icon icon-users icon-left"/>
                    See all
                  </button>
                </div>
              )
              : (null)
          }

          {
            canInviteUsers
              ? (
                <button className="btn btn-of">
                  <span className="icon icon-user-plus icon-left"/>
                  Invite
                </button>
              )
              : (null)
          }

          {
            !canInviteUsers && !hasUsers
              ? (
                <div style={{opacity: .2}}>
                  <span className="icon icon-32px icon-cool"></span>
                  <span className="icon icon-32px icon-sleepy"></span>
                  <span className="icon icon-32px icon-shocked"></span>
                  <span className="icon icon-32px icon-hipster"></span>
                  <span className="icon icon-32px icon-frustrated"></span>
                  <span className="icon icon-32px icon-baffled"></span>
                  <span className="icon icon-32px icon-evil"></span>
                </div>
              )
              : (null)
          }
        </div>
      </DataFetchComponent>
    )
  }

}

UsersComponent.defaultProps = {
  users: {
    [userRoles.administrator.role]: {count: 0},
    [userRoles.surveyManager.role]: {count: 0},
    [userRoles.dataAnalysis.role]: {count: 0},
    [userRoles.dataEntry.role]: {count: 0},
  }
}

const mapStateToProps = state => ({
  surveyId: appState.surveyId(state),
  surveyStatusApp: appState.surveyStatus(state),
  users: R.path(statePaths.users)(state),
})

export default connect(mapStateToProps)(UsersComponent)