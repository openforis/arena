import './form.scss'

import React from 'react'

import { TooltipError } from '../tooltip'
import MaskedInput from 'react-text-mask'

export const FormItem = ({label, children}) => (
  <div className="form-item">
    <label className="form-label">{label}</label>
    {children}
  </div>
)

export const Input = React.forwardRef((props, ref) => {

  const {
    validation = {},
    disabled = false,
    mask = false,
    ...inputProps,
  } = props

  return (
    <TooltipError messages={validation.errors}>
      <MaskedInput ref={ref}
                   mask={mask}
                   className="form-input"
                   aria-disabled={disabled}
                   {...inputProps}
      />


    </TooltipError>
  )
})