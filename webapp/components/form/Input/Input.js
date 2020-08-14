import '../form.scss'

import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import NumberFormat from 'react-number-format'

import { useOnUpdate } from '../../hooks'
import ValidationTooltip from '../../validationTooltip'

export const Input = React.forwardRef((props, ref) => {
  const {
    disabled,
    id,
    maxLength,
    numberFormat,
    onChange,
    onFocus,
    placeholder,
    readOnly,
    type,
    validation,
    value,
  } = props

  // workaround for inputRef: useRef(ref) does not work as expected
  const inputRefInternal = useRef(null)
  const inputRef = ref || inputRefInternal
  const selectionAllowed = type === 'text'
  const selectionInitial = selectionAllowed ? [value.length, value.length] : null
  const selectionRef = useRef(selectionInitial)

  const handleValueChange = (newValue) => {
    const input = inputRef.current
    if (newValue !== value) {
      if (selectionAllowed) {
        selectionRef.current = [input.selectionStart, input.selectionEnd]
      }
      if (onChange) {
        onChange(newValue)
      }
    }
  }

  useOnUpdate(() => {
    if (selectionAllowed) {
      const input = inputRef.current
      ;[input.selectionStart, input.selectionEnd] = selectionRef.current
    }
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
          type,
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
          type={type}
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
  type: PropTypes.oneOf(['text', 'number']),
  validation: PropTypes.object,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
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
  type: 'text',
  validation: null,
  value: '',
  numberFormat: null,
}
