import './errorBadge.scss'

import React from 'react'
import { getValidationFieldMessagesHTML } from '../appUtils/validationUtils'

const ErrorBadge = ({validation, showLabel}) => {

  const invalid = validation && !validation.valid

  return invalid
    ? (
      <div className="error-badge">
        <div className="error-badge__warning">
          <span className="icon icon-warning icon-12px icon-left"/>
          {
            showLabel &&
            <span>INVALID</span>
          }
        </div>
        <div className="error-badge__messages">
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