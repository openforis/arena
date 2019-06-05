import './form.scss'

import React from 'react'

import ValidationTooltip from '../validationTooltip'
import { TextMask, InputAdapter } from 'react-text-mask-hoc'

export const FormItem = ({ label, children }) => (
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
    onChange,
    value,
    ...inputProps
  } = props

  return (
    <ValidationTooltip
      messages={validation}
      type={`${validation.errors ? 'error' : ''}`}
      className="form-input-container">

      <TextMask
        ref={ref}
        Component={InputAdapter}
        mask={mask}
        className="form-input"
        aria-disabled={disabled}
        isControlled={true}
        value={value}
        onChange={(e, { value: newValue }) => {
          if (onChange && value !== newValue) {
            onChange(newValue)
          }
        }}
        {...inputProps}
      />

    </ValidationTooltip>
  )
})