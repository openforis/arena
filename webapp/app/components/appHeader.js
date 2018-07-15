import React from 'react'
import { connect } from 'react-redux'
import { Redirect, Link } from 'react-router-dom'

import * as R from 'ramda'

import { appState, loginUri, isHome, appUri } from '../app'
import { logout } from '../actions'
import { getLocationPathname } from '../../app-utils/routerUtils'

class AppHeader extends React.Component {

  render () {
    const {user, logout} = this.props
    const path = getLocationPathname(this.props)

    return (
      <div className="app-header">
        <div>
          {
            isHome(path)
              ? (null)
              : (
                <Link to={appUri()} className="btn btn-s btn-of-light-xs">
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
        {/*logout*/}
        {
          user
            ? (null)
            : (
              R.equals(path, loginUri)
                ? null
                : <Redirect to={loginUri}/>
            )
        }
      </div>
    )
  }

}

const mapStateToProps = state => ({
  user: appState.getUser(state)
})

export default connect(mapStateToProps, {logout})(AppHeader)