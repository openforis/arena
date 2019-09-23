import './errorBadge.scss'

import React from 'react'

import { useI18n } from './hooks'

import Validation from '../../common/validation/validation'

import ValidationTooltip from './validationTooltip'

const ErrorBadge = props => {

  const {
    validation, children, className,
    showLabel, labelKey, showKeys,
  } = props

  const i18n = useI18n()
  const invalid = !Validation.isValid(validation)

  return invalid
    ? (
      <ValidationTooltip
        validation={validation}
        showKeys={showKeys}
        className={`badge error-badge ${className}`}>

        <div className="badge__content">
          {children}

          <span className={`icon icon-warning icon-12px${showLabel ? ' icon-left' : ''}`}/>

          {
            showLabel &&
            <span>{i18n.t(labelKey)}</span>
          }
        </div>

      </ValidationTooltip>
    )
    : null
}

ErrorBadge.defaultProps = {
  validation: null,
  showLabel: true,
  labelKey: 'common.invalid',
  showKeys: false,
  className: '',
}

export default ErrorBadge