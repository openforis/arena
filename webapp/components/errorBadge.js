import './errorBadge.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as Validation from '@core/validation/validation'
import { useI18n } from '@webapp/store/system'

import ValidationTooltip from './validationTooltip'

const ErrorBadge = (props) => {
  const { children, className: classNameProps, labelKey, showIcon, showLabel, showKeys, validation } = props

  const i18n = useI18n()
  const valid = Validation.isValid(validation)

  let className = classNameProps
  if (Validation.isError(validation)) className += ' error'
  else if (Validation.isWarning(validation)) className += ' warning'

  if (valid) return null

  return (
    <ValidationTooltip validation={validation} showKeys={showKeys} className={`badge error-badge ${className}`}>
      <div className="badge__content">
        {children}

        {showIcon && <span className={`icon icon-warning icon-12px${showLabel ? ' icon-left' : ''}`} />}

        {showLabel && <span>{i18n.t(labelKey)}</span>}
      </div>
    </ValidationTooltip>
  )
}

ErrorBadge.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  labelKey: PropTypes.string,
  showIcon: PropTypes.bool,
  showKeys: PropTypes.bool,
  showLabel: PropTypes.bool,
  validation: PropTypes.object,
}

ErrorBadge.defaultProps = {
  children: null,
  className: '',
  labelKey: 'common.invalid',
  showIcon: false,
  showKeys: false,
  showLabel: true,
  validation: null,
}

export default ErrorBadge
