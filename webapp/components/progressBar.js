import './progressBar.scss'

import React from 'react'
import classNames from 'classnames'

const ProgressBar = (props) => {
  const { progress, className = '', showText } = props

  return (
    <div className={classNames('progress-bar', className, { running: progress > 0 })}>
      <div className="filler" style={{ width: `${progress}%` }} />
      {showText && <span className="progress">({progress}%)</span>}
    </div>
  )
}

ProgressBar.defaultProps = {
  progress: 0,
  className: '',
  showText: true,
}

export default ProgressBar
