import './appLoaderView.scss'
import React from 'react'
import { CSSTransition } from 'react-transition-group'

import { useLoader } from '@webapp/store/ui'

const AppLoaderView = () => {
  const visible = useLoader()

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

export default AppLoaderView
