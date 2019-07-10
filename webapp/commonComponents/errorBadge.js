import './errorBadge.scss'

import React from 'react'

import useI18n from '../commonComponents/useI18n'

import Validator from '../../common/validation/validator'

import ValidationTooltip from './validationTooltip'

const ErrorBadge = props => {

  const {
    validation, children, className,
    showLabel, labelKey, showKeys,
  } = props

  const i18n = useI18n()
  const invalid = !Validator.isValidationValid(validation)

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
  showKeys: true,
  className: '',
}

export default ErrorBadge