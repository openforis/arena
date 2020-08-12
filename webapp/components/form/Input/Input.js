import '../form.scss'

import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import NumberFormat from 'react-number-format'

import { useOnUpdate } from '../../hooks'
import ValidationTooltip from '../../validationTooltip'

export const Input = React.forwardRef((props, ref) => {
  const { disabled, id, maxLength, numberFormat, onChange, onFocus, placeholder, readOnly, validation, value } = props

  const inputRef = useRef(ref)
  const selectionRef = useRef([value.length, value.length])

  const handleValueChange = (newValue) => {
    const input = inputRef.current
    if (newValue !== value) {
      selectionRef.current = [input.selectionStart, input.selectionEnd]
      if (onChange) {
        onChange(newValue)
      }
    }
  }

  useOnUpdate(() => {
    const input = inputRef.current
    ;[input.selectionStart, input.selectionEnd] = selectionRef.current
  }, [value])

  return (
    <ValidationTooltip validation={validation} className="form-input-container">
      {numberFormat ? (
        React.createElement(NumberFormat, {
          disabled,
          className: 'form-input',
          getInputRef: (el) => {
            inputRef.current = el
          },
          id,
          onValueChange: ({ formattedValue: newValue }) => handleValueChange(newValue),
          onFocus,
          placeholder,
          readOnly,
          value,
          ...numberFormat,
        })
      ) : (
        <input
          ref={inputRef}
          aria-disabled={disabled}
          className="form-input"
          disabled={disabled}
          id={id}
          maxLength={maxLength}
          onChange={(event) => handleValueChange(event.target.value)}
          onFocus={onFocus}
          placeholder={placeholder}
          readOnly={readOnly}
          value={value}
        />
      )}
    </ValidationTooltip>
  )
})

Input.propTypes = {
  disabled: PropTypes.bool,
  id: PropTypes.string,
  maxLength: PropTypes.number,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  validation: PropTypes.object,
  value: PropTypes.string,
  numberFormat: PropTypes.shape({
    decimalScale: PropTypes.number,
    decimalSeparator: PropTypes.string,
    format: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    maxLength: PropTypes.number,
    placeholder: PropTypes.string,
  }),
}

Input.defaultProps = {
  disabled: false,
  id: null,
  maxLength: null,
  onChange: null,
  onFocus: () => {},
  placeholder: null,
  readOnly: false,
  validation: null,
  value: '',
  numberFormat: null,
}
