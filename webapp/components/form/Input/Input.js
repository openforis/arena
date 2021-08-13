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
    onChange,
    onFocus,
    onBlur,
    placeholder,
    readOnly,
    title: titleProp,
    type,
    validation,
    value,
    numberFormat,
    textTransformFunction,
  } = props

  // workaround for inputRef: useRef(ref) does not work as expected
  const inputRefInternal = useRef(null)
  const inputRef = ref || inputRefInternal
  const selectionAllowed = type === 'text'
  const selectionInitial = selectionAllowed ? [value.length, value.length] : null
  const selectionRef = useRef(selectionInitial)
  const valueText = value === null || Number.isNaN(value) ? '' : String(value)
  const title = titleProp || valueText

  const handleValueChange = (newValue) => {
    const input = inputRef.current
    if (selectionAllowed) {
      selectionRef.current = [input.selectionStart, input.selectionEnd]
    }
    if (onChange) {
      onChange(textTransformFunction(newValue))
    }
  }

  useOnUpdate(() => {
    if (selectionAllowed) {
      const input = inputRef.current
      ;[input.selectionStart, input.selectionEnd] = selectionRef.current
    }
  }, [value])

  return (
    <ValidationTooltip key={`validation-${id}`} validation={validation} className="form-input-container">
      {numberFormat ? (
        <NumberFormat
          disabled={disabled}
          className="form-input"
          getInputRef={(el) => {
            inputRef.current = el
          }}
          id={id}
          data-testid={id}
          onValueChange={({ formattedValue }) => formattedValue !== valueText && handleValueChange(formattedValue)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          readOnly={readOnly}
          type={type}
          value={value}
          title={title}
          {...numberFormat}
        />
      ) : (
        <input
          ref={inputRef}
          aria-disabled={disabled}
          className="form-input"
          disabled={disabled}
          data-testid={id}
          id={id}
          maxLength={maxLength}
          onChange={(event) => handleValueChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          readOnly={readOnly}
          type={type}
          value={value}
          title={title}
          autoComplete="off"
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
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  title: PropTypes.string,
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
  textTransformFunction: PropTypes.func,
}

Input.defaultProps = {
  disabled: false,
  id: null,
  maxLength: null,
  onChange: null,
  onFocus: () => {},
  onBlur: () => {},
  placeholder: null,
  readOnly: false,
  title: null, // defaults to value
  type: 'text',
  validation: null,
  value: '',
  numberFormat: null,
  textTransformFunction: (s) => s,
}
