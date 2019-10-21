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

interface IProps {
  validation?: any;
  disabled?: any;
  mask?: any;
  onChange: (value: any) => void;
  value: any;

  placeholder?: any;
  readOnly?: boolean;
  maxLength?: number;
  onFocus?: (value: any) => void;
}
export const Input = React.forwardRef((props: IProps, ref: any) => {

  const {
    validation = {},
    disabled = false,
    mask = false,
    onChange,
    value,
    ...inputProps
  } = props

  const onChangeValue = newValue => {
    if (onChange && value !== newValue) {
      onChange(newValue)
    }
  }

  return (
    <ValidationTooltip
      validation={validation}
      showKeys={true}
      className="form-input-container">

      {
        mask
          ? (
            <TextMask
              ref={ref}
              Component={InputAdapter}
              mask={mask}
              className="form-input"
              aria-disabled={disabled}
              isControlled={true}
              value={value}
              onChange={(e, { value }) => onChangeValue(value)}
              {...inputProps}
            />
          )
          : (
            <input
              ref={ref}
              className="form-input"
              aria-disabled={disabled}
              value={value}
              onChange={e => onChangeValue(e.target.value)}
              {...inputProps}
            />
          )
      }

    </ValidationTooltip>
  )
})
