import './form.scss'

import React from 'react'

import { TextMask, InputAdapter } from 'react-text-mask-hoc'
import ValidationTooltip from '../validationTooltip'

export const FormItem = ({ label, children, className = '' }) => (
  <div className={`form-item ${className}`}>
    <label className="form-label">{label}</label>
    {children}
  </div>
)

const InputComponent = (props, ref) => {
  const { validation = {}, disabled = false, mask = false, onChange, value, ...inputProps } = props

  const onChangeValue = (newValue) => {
    if (onChange && value !== newValue) {
      onChange(newValue)
    }
  }

  return (
    <ValidationTooltip validation={validation} className="form-input-container">
      {mask ? (
        <TextMask
          ref={ref}
          Component={InputAdapter}
          mask={mask}
          className="form-input"
          aria-disabled={disabled}
          disabled={disabled}
          isControlled={true}
          value={value}
          onChange={(e, { value }) => onChangeValue(value)}
          {...inputProps}
        />
      ) : (
        <input
          ref={ref}
          className="form-input"
          aria-disabled={disabled}
          disabled={disabled}
          value={value}
          onChange={(e) => onChangeValue(e.target.value)}
          {...inputProps}
        />
      )}
    </ValidationTooltip>
  )
}

export const Input = React.forwardRef(InputComponent)
