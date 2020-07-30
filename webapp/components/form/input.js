import './form.scss'

import React, { useLayoutEffect, useRef, useState } from 'react'

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

  const innerRef = useRef(ref)
  const [selection, setSelection] = useState(null)

  useLayoutEffect(() => {
    const input = innerRef.current
    if (selection && input) {
      ;[input.selectionStart, input.selectionEnd] = selection
    }
  }, [selection])

  const handleChange = (event) => {
    const input = event.target
    const newValue = input.value
    if (onChange && value !== newValue) {
      onChange(newValue)
    }
    setSelection([input.selectionStart, input.selectionEnd])
  }

  return (
    <ValidationTooltip validation={validation} className="form-input-container">
      {mask ? (
        <TextMask
          ref={innerRef}
          Component={InputAdapter}
          mask={mask}
          className="form-input"
          aria-disabled={disabled}
          disabled={disabled}
          isControlled={true}
          value={value}
          onChange={handleChange}
          {...inputProps}
        />
      ) : (
        <input
          ref={innerRef}
          className="form-input"
          aria-disabled={disabled}
          disabled={disabled}
          value={value}
          onChange={handleChange}
          {...inputProps}
        />
      )}
    </ValidationTooltip>
  )
}

export const Input = React.forwardRef(InputComponent)
