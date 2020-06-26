import './loadingBar.scss'
import React from 'react'

import ProgressBar from '@webapp/components/progressBar'

const LoadingBar = () => {
  return (
    <div className="data-query-loading-bar">
      <ProgressBar className="running progress-bar-striped" progress={100} showText={false} />
    </div>
  )
}

export default LoadingBar
