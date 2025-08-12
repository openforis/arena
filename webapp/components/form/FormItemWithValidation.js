import React from 'react'

import ValidationTooltip from '../validationTooltip'
import { FormItem } from './Input'

export const FormItemWithValidation = (props) => {
  const { children, hideLabelInMobile, label, labelParams, validation } = props

  return (
    <ValidationTooltip validation={validation}>
      <FormItem hideLabelInMobile={hideLabelInMobile} label={label} labelParams={labelParams}>
        {children}
      </FormItem>
    </ValidationTooltip>
  )
}
