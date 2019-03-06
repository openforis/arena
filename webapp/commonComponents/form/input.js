import './form.scss'

import React from 'react'

import Tooltip from '../tooltip2'
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
    <Tooltip
      messages={validation.errors}
      type={`${validation.errors ? 'error' : ''}`}
      style={{ display: 'grid', width: '100%', height: '100%' }}>
      <TextMask ref={ref}
                Component={InputAdapter}
                mask={mask}
                className="form-input"
                aria-disabled={disabled}
                isControlled={true}
                value={value}
                onChange={(e, { caretPosition, value: newValue }) => {
                  if (onChange && value !== newValue) {
                    onChange(newValue)
                  }
                }}
                {...inputProps}
      />
    </Tooltip>
  )
})