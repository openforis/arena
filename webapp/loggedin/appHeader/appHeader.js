import './appHeader.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as AppState from '../../app/appState'

const AppHeader = () => {

  return (
    <div className="app-header">

    </div>
  )

}

const mapStateToProps = state => ({
  user: AppState.getUser(state)
})

export default connect(mapStateToProps)(AppHeader)