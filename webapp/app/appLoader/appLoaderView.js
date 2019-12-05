import './appLoaderView.scss'

import React from 'react'
import { connect } from 'react-redux'
import { CSSTransition } from 'react-transition-group'

import * as AppState from '../appState'

const AppLoaderView = props => {
  const { visible } = props

  return (
    <CSSTransition in={visible} timeout={750} unmountOnExit className="app-loader">
      <div>
        <div className="app-loader__boxes">
          <div />
          <div />
          <div />
        </div>
      </div>
    </CSSTransition>
  )
}

const mapStateToProps = state => ({
  visible: AppState.isLoaderVisible(state),
})

export default connect(mapStateToProps)(AppLoaderView)
