import React from 'react'

import PropTypes from 'prop-types'
import ValidationTooltip from '../validationTooltip'
import { FormItem } from './Input'

export const FormItemWithValidation = (props) => {
  const { children, hideLabelInMobile, label, labelParams, validation } = props

  return (
    <FormItem hideLabelInMobile={hideLabelInMobile} label={label} labelParams={labelParams}>
      <ValidationTooltip validation={validation}>{children}</ValidationTooltip>
    </FormItem>
  )
}

FormItemWithValidation.propTypes = {
  children: PropTypes.node.isRequired,
  hideLabelInMobile: PropTypes.bool,
  label: PropTypes.string,
  labelParams: PropTypes.object,
  validation: PropTypes.object,
}
