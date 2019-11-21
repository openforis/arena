import React from 'react'

import ValidationFieldMessages from '@webapp/commonComponents/validationFieldMessages'
import * as Validation from '@core/validation/validation'

import Tooltip from './tooltip'

export default ({ validation, className, showKeys, children }) => {
  const isValid = Validation.isValid(validation)

  const type = isValid
    ? ''
    : Validation.isWarning(validation)
      ? 'warning'
      : 'error'

  const content = isValid
    ? null
    : React.createElement(ValidationFieldMessages, { validation, showKeys })

  return (
    <Tooltip
      type={type}
      content={content}
      className={className}>
      {children}
    </Tooltip>
  )
}