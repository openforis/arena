import './progressBar.scss'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { LinearProgress } from '@mui/material'

const ProgressBarWithLabel = (props) => {
  const { className, color, value } = props

  return (
    <div className={classNames('progress-bar-with-label', className)}>
      <LinearProgress className={className} color={color} value={value} variant="determinate" />
      <span>{Math.floor(value)}%</span>
    </div>
  )
}

ProgressBarWithLabel.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOf(['primary', 'secondary', 'error', 'info', 'success', 'warning', 'inherit']),
  value: PropTypes.number,
}

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
