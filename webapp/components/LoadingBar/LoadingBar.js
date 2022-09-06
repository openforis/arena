import './loadingBar.scss'
import React from 'react'

import ProgressBar from '@webapp/components/progressBar'

const LoadingBar = () => (
  <div className="loading-bar">
    <ProgressBar className="progress-bar-striped" progress={100} showText={false} />
  </div>
)

export default LoadingBar
