import './Loader.scss'
import { useRef } from 'react'
import { CSSTransition } from 'react-transition-group'

import { useLoader } from '@webapp/store/ui'

const Loader = () => {
  const visible = useLoader()

  const nodeRef = useRef(null)

  return (
    <CSSTransition classNames="loader" in={visible} nodeRef={nodeRef} timeout={750} unmountOnExit>
      <div ref={nodeRef}>
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
