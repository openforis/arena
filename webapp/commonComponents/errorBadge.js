import './errorBadge.scss'

import React from 'react'
import * as R from 'ramda'

import { getValidationFieldMessagesHTML } from '../appUtils/validationUtils'
import Validator from '../../common/validation/validator'

import Tooltip from '../commonComponents/tooltip2'

const ErrorBadge = ({ validation, showLabel, label }) => {

  const invalid = !Validator.isValidationValid(validation)

  const validationFields = invalid ? getValidationFieldMessagesHTML(validation.fields) : []

  return invalid
    ? (
      <Tooltip
        message={validationFields}
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
  label: 'INVALID'
}

export default ErrorBadge