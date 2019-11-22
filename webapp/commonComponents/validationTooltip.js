import React from 'react'

import ValidationFieldMessages from '@webapp/commonComponents/validationFieldMessages'
import * as Validation from '@core/validation/validation'

import Tooltip from './tooltip'

export default ({ validation, className, showKeys, children }) => {
  const isValid = Validation.isValid(validation)

  let type = ''
  if (Validation.isError(validation)) {
    type = 'error'
  } else if (Validation.isWarning(validation)) {
    type = 'warning'
  }

  const content = isValid
    ? null
    : React.createElement(ValidationFieldMessages, { validation, showKeys })

  const show = Validation.isWarning(validation) || Validation.isError(validation)

  return (
    <Tooltip
      type={type}
      content={content}
      className={className}
      show={show}>
      {children}
    </Tooltip>
  )
}