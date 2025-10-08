import './Loader.scss'
import React from 'react'

import { useLoader } from '@webapp/store/ui'

const Loader = () => {
  const visible = useLoader()

  if (!visible) {
    return
  }
  return (
    <div>
      <div className="loader__boxes">
        <div />
        <div />
        <div />
      </div>
    </div>
  )
}

export default Loader
