import React from 'react'
import { connect } from 'react-redux'

import { appUser } from '../app'
import { logout } from '../actions'

class AppHeader extends React.Component {

  render () {
    const {user, logout} = this.props

    return (
      <div className="app-header">

        <div></div>
        <div className="app-header__user">
          <h6 className="text-uppercase">{user.name}</h6>
          <button className="btn btn-xs btn-of-light-xs icon-right"
                  onClick={() => logout()}>
            <span className="icon icon-exit"/>
          </button>
        </div>

      </div>
    )
  }

}

const mapStateToProps = state => ({
  user: appUser(state)
})

export default connect(mapStateToProps, {logout})(AppHeader)