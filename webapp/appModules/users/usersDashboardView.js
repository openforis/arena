import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import DataFetchComponent from '../components/moduleDataFetchComponent'

import { appState } from '../../app/app'
import { appModules, getDashboardData } from '../appModules'
import { userRoles } from '../../../common/user/userRole'

const canInviteUsers = false

class UsersDashboardView extends React.Component {

  render () {
    const {users} = this.props
    const roleKeys = R.keys(users)

    const roleUsersCount = role => R.prop('count', users[role])
    const roleHasUsers = role => roleUsersCount(role) > 0
    const hasUsers = roleKeys.some(roleHasUsers)

    return (
      <DataFetchComponent module={appModules.users} dashboard={true}>
        <div className="app-dashboard__module">

          <div className="flex-center title-of">
            <span className="icon icon-users icon-24px icon-left"/>
            <h5>Users</h5>
          </div>

          {
            hasUsers
              ? (
                <div className="app-dashboard__module-item">
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

UsersDashboardView.defaultProps = {
  users: {
    getSurveyId: -1,
    [userRoles.administrator.role]: {count: 0},
    [userRoles.surveyManager.role]: {count: 0},
    [userRoles.dataAnalysis.role]: {count: 0},
    [userRoles.dataEntry.role]: {count: 0},
  }
}

const mapStateToProps = state => ({
  surveyStatusApp: appState.getSurveyStatus(state),
  users: getDashboardData(appModules.users)(state),
})

export default connect(mapStateToProps)(UsersDashboardView)