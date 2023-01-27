import './progressBar.scss'

import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import { LinearProgress } from '@mui/material'

const ProgressBarWithLabel = (props) => (
  <div className="progress-bar-with-label">
    <LinearProgress variant="determinate" {...props} />
    <span>{Math.floor(props.value)}%</span>
  </div>
)

const ProgressBar = (props) => {
  const { color, indeterminate, progress, className: classNameProp, showText } = props

  const className = classNames('progress-bar', classNameProp)

  if (indeterminate) {
    return <LinearProgress className={className} color={color} />
  }
  if (showText) {
    return <ProgressBarWithLabel className={className} color={color} value={progress} />
  }
  return <LinearProgress className={className} color={color} variant="determinate" value={progress} />
}

ProgressBar.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOf(['primary', 'secondary', 'error', 'info', 'success', 'warning', 'inherit']),
  indeterminate: PropTypes.bool,
  progress: PropTypes.number,
  showText: PropTypes.bool,
}

ProgressBar.defaultProps = {
  indeterminate: true,
  progress: 0,
  showText: true,
}

export default ProgressBar
