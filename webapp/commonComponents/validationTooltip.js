import React from 'react'

import * as Validation from '@core/validation/validation'

import ValidationFieldMessages from '@webapp/commonComponents/validationFieldMessages'
import Tooltip from './tooltip'

const ValidationTooltip = props => {
  const { validation, className, showKeys, children } = props

  const isValid = Validation.isValid(validation)

  const type = Validation.isError(validation) ? 'error' : Validation.isWarning(validation) ? 'warning' : ''

  const content = isValid ? null : React.createElement(ValidationFieldMessages, { validation, showKeys })

  const showContent = Validation.isWarning(validation) || Validation.isError(validation)

  return (
    <Tooltip type={type} messageComponent={content} className={className} showContent={showContent}>
      {children}
    </Tooltip>
  )
}

ValidationTooltip.defaultProps = {
  validation: null,
  className: '',
  showKeys: false,
}

export default ValidationTooltip
