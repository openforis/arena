import './errorBadge.scss'

import React from 'react'
import * as R from 'ramda'

import { getValidationFieldMessagesHTML } from '../appUtils/validationUtils'

const ErrorBadge = ({ validation, showLabel }) => {

  const invalid = validation && !validation.valid

  const validationFields = invalid ? getValidationFieldMessagesHTML(validation.fields) : []

  return invalid
    ? (
      <div className="badge error-badge">
        <div className="badge__content">
          <span className={`icon icon-warning icon-12px${showLabel ? ' icon-left' : ''}`}/>
          {
            showLabel &&
            <span>INVALID</span>
          }
        </div>

        {
          !R.isEmpty(validationFields) &&
          <div className="messages">
            {validationFields}
          </div>
        }
      </div>
    )
    : null
}

ErrorBadge.defaultProps = {
  validation: null,
  showLabel: true,
}

export default ErrorBadge