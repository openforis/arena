import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import InviteUserDialog from './inviteUserDialog'

const canInviteUsers = true

class Users extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      showInviteDialog: false
    }
  }

  toggleInviteUserDialog(show) {
    this.setState({
      showInviteDialog: show
    })
  }

  render () {
    const {users} = this.props
    const { showInviteDialog } = this.state
    
    const roleKeys = R.keys(users)

    const roleUsersCount = role => R.prop('count', users[role])
    const roleHasUsers = role => roleUsersCount(role) > 0
    const hasUsers = roleKeys.some(roleHasUsers)

    return (
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
              <button className="btn btn-of" onClick={() => this.toggleInviteUserDialog(true)}>
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

        {showInviteDialog &&
          <InviteUserDialog onCancel={() => this.toggleInviteUserDialog(false)}
                            onInvite={() => {alert('TODO'); this.toggleInviteUserDialog(false)}}/>
        }

      </div>
    )
  }

}

Users.defaultProps = {
  users: {
    surveyId: -1,
    // [userRoles.administrator.role]: {count: 0},
    // [userRoles.surveyManager.role]: {count: 0},
    // [userRoles.dataAnalysis.role]: {count: 0},
    // [userRoles.dataEntry.role]: {count: 0},
  }
}

const mapStateToProps = state => ({
  surveyStatusApp: 'draft',
})

export default connect(mapStateToProps)(Users)