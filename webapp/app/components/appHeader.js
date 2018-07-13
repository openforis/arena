import React from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'

import * as R from 'ramda'

import { appState, loginUri } from '../app'
import { logout } from '../actions'

class AppHeader extends React.Component {

  render () {
    const {user, logout, history} = this.props

    return (
      <div className="app-header">

        <div></div>
        <div className="app-header__user">
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
              R.pathEq(['location', 'pathname'], loginUri, history)
                ? null
                : <Redirect to={loginUri}/>
            )
        }
      </div>
    )
  }

}

const mapStateToProps = state => ({
  user: appState.user(state)
})

export default connect(mapStateToProps, {logout})(AppHeader)