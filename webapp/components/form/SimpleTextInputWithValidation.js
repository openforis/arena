import React from 'react'

import { SimpleTextInput } from './SimpleTextInput'
import { useIsMobile } from '../hooks/useIsMobile'
import { FormItemWithValidation } from './FormItemWithValidation'

export const SimpleTextInputWithValidation = (props) => {
  const { label, labelParams, validation, ...rest } = props

  const isMobile = useIsMobile()

  const inputFieldParams = { ...rest }

  if (isMobile) {
    Object.assign(inputFieldParams, { label, labelParams })
  }

  return (
    <FormItemWithValidation hideLabelInMobile label={label} labelParams={labelParams} validation={validation}>
      <SimpleTextInput {...inputFieldParams} />
    </FormItemWithValidation>
  )
}
