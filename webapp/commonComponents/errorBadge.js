import './errorBadge.scss'

import React from 'react'

import * as ValidationUtils from '../utils/validationUtils'
import Validator from '../../common/validation/validator'

import Tooltip from './tooltip'

const ErrorBadge = ({ validation, showLabel, label, tooltipErrorMessage }) => {

  const invalid = !Validator.isValidationValid(validation)

  const errorMessages = invalid
    ? tooltipErrorMessage
      ? [tooltipErrorMessage]
      : ValidationUtils.getValidationFieldMessagesHTML(Validator.getFieldValidations(validation))
    : []

  return invalid
    ? (
      <Tooltip
        messages={errorMessages}
        type="error"
        className="badge error-badge">
        <div className="badge__content">
          <span className={`icon icon-warning icon-12px${showLabel ? ' icon-left' : ''}`}/>
          {
            showLabel &&
            <span>{label}</span>
          }
        </div>
      </Tooltip>
    )
    : null
}

ErrorBadge.defaultProps = {
  validation: null,
  showLabel: true,
  label: 'INVALID',
  //error message to show if validation is invalid (if not specified, field validation errors will be shown)
  tooltipErrorMessage: null
}

export default ErrorBadge