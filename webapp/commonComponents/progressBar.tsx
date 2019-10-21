import './progressBar.scss'

import React from 'react'

const ProgressBar = (props) => {
  const {
    progress, className = '',
    showText,
  } = props

  return (
    <div className={`progress-bar ${className}`}>
      <div className="filler" style={{ width: `${progress}%` }}/>
      {
        showText &&
        <span className="progress">({progress}%)</span>
      }
    </div>
  )
}

ProgressBar.defaultProps = {
  progress: 0,
  className: '',
  showText: true,
}

export default ProgressBar
