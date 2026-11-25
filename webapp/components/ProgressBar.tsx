import './ProgressBar.scss'

import { LinearProgress } from '@mui/material'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'

type ProgressBarWithLabelProps = {
  className?: string
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'inherit'
  textKey?: string
  value?: number
}

const ProgressBarWithLabel = (props: ProgressBarWithLabelProps) => {
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

type ProgressBarProps = {
  className?: string
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'inherit'
  indeterminate?: boolean
  progress?: number
  showText?: boolean
  textKey?: string
}

const ProgressBar = (props: ProgressBarProps) => {
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

export default ProgressBar
