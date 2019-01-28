import './errorBadge.scss'

import React from 'react'
import { getValidationFieldMessagesHTML } from '../appUtils/validationUtils'

const ErrorBadge = ({ validation, showLabel }) => {

  const invalid = validation && !validation.valid

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
        <div className="messages">
          {
            getValidationFieldMessagesHTML(validation.fields)
          }
        </div>
      </div>
    )
    : null
}

ErrorBadge.defaultProps = {
  validation: null,
  showLabel: true,
}

export default ErrorBadge