import './Loader.scss'

import React from 'react'
import { CSSTransition } from 'react-transition-group'

import { useLoader } from '@webapp/store/ui'

const Loader = () => {
  const visible = useLoader()

  return (
    <CSSTransition in={visible} timeout={750} unmountOnExit className="loader">
      <div>
        <div className="loader__boxes">
          <div />
          <div />
          <div />
        </div>
      </div>
    </CSSTransition>
  )
}

export default Loader
