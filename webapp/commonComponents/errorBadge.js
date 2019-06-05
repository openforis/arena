import './errorBadge.scss'

import React from 'react'

import useI18n from '../commonComponents/useI18n'

import Validator from '../../common/validation/validator'

import ValidationTooltip from './validationTooltip'

const ErrorBadge = ({ validation, showLabel, labelKey, tooltipErrorMessage }) => {

  const i18n = useI18n()
  const invalid = !Validator.isValidationValid(validation)

  return invalid
    ? (
      <ValidationTooltip
        validation={Validator.getFieldValidations(validation)}
        type="error"
        className="badge error-badge">
        <div className="badge__content">
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
  //error message to show if validation is invalid (if not specified, field validation errors will be shown)
  tooltipErrorMessage: null,
}

export default ErrorBadge