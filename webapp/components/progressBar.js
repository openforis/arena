import './progressBar.scss'

import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import { LinearProgress } from '@mui/material'

import { useI18n } from '@webapp/store/system'

const ProgressBarWithLabel = (props) => {
  const { className, color, textKey = null, value } = props

  const i18n = useI18n()
  const progressPercent = Math.floor(value)
  const text = textKey ? i18n.t(textKey, { progressPercent }) : `${progressPercent}%`

  return (
    <div className={classNames('progress-bar-with-label', className)}>
      <LinearProgress className={className} color={color} value={value} variant="determinate" />
      <span>{text}</span>
    </div>
  )
}

ProgressBarWithLabel.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOf(['primary', 'secondary', 'error', 'info', 'success', 'warning', 'inherit']),
  textKey: PropTypes.string,
  value: PropTypes.number,
}

const ProgressBar = (props) => {
  const { className: classNameProp, color, indeterminate = true, progress = 0, showText = true, textKey = null } = props

  const className = classNames('progress-bar', classNameProp)

  if (indeterminate) {
    return <LinearProgress className={className} color={color} />
  }
  if (showText) {
    return <ProgressBarWithLabel className={className} color={color} textKey={textKey} value={progress} />
  }
  return <LinearProgress className={className} color={color} variant="determinate" value={progress} />
}

ProgressBar.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOf(['primary', 'secondary', 'error', 'info', 'success', 'warning', 'inherit']),
  indeterminate: PropTypes.bool,
  progress: PropTypes.number,
  showText: PropTypes.bool,
  textKey: PropTypes.string,
}

export default ProgressBar
