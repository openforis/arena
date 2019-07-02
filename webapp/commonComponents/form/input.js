import './form.scss'

import React from 'react'

import ValidationTooltip from '../validationTooltip'
import { TextMask, InputAdapter } from 'react-text-mask-hoc'

export const FormItem = ({ label, children, className = '' }) => (
  <div className={`form-item ${className}`}>
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
      validation={validation}
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