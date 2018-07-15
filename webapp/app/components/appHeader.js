import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import { appState, isLocationHome, appModuleUri } from '../app'
import { logout } from '../actions'

class AppHeader extends React.Component {

  render () {
    const {user, logout} = this.props

    return (
      <div className="app-header">
        <div>
          {
            isLocationHome(this.props)
              ? (null)
              : (
                <Link to={appModuleUri()} className="btn btn-s btn-of-light-xs">
                  <span className="icon icon-home2 icon-20px"></span>
                </Link>
              )

          }
        </div>

        <div></div>

        <div className="flex-center">
          <h6 className="text-uppercase">{user && user.name}</h6>
          <button className="btn btn-s btn-of-light-xs icon-right"
                  onClick={() => logout()}>
            <span className="icon icon-exit"/>
          </button>
        </div>

      </div>
    )
  }

}

const mapStateToProps = state => ({
  user: appState.getUser(state)
})

export default connect(mapStateToProps, {logout})(AppHeader)