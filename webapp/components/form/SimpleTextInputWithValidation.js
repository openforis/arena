import React from 'react'
import PropTypes from 'prop-types'

import ValidationTooltip from '../validationTooltip'
import { SimpleTextInput } from './SimpleTextInput'

export const SimpleTextInputWithValidation = (props) => {
  const { validation = undefined, className = undefined, ...rest } = props

  return (
    <ValidationTooltip validation={validation} className={className}>
      <SimpleTextInput {...rest} />
    </ValidationTooltip>
  )
}

SimpleTextInputWithValidation.propTypes = {
  ...SimpleTextInput.propTypes,
  className: PropTypes.string,
  validation: PropTypes.object,
}
