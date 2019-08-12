import './appHeader.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as AppState from '../../app/appState'

const AppHeader = () => {

  return (
    <div className="app-header">

      <div className="app-header__logo">
        <img src="/img/of-logo-small.png"/>
      </div>

      <div className="app-header__user">
        <img src="https://cdn0.iconfinder.com/data/icons/user-pictures/100/unknown2-512.png"/>
        <button className="btn btn-transparent">
          <span className="icon icon-ctrl"/>
        </button>
      </div>

    </div>
  )

}

const mapStateToProps = state => ({
  user: AppState.getUser(state)
})

export default connect(mapStateToProps)(AppHeader)