import '../form.scss'

import React, { useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import NumberFormat from 'react-number-format'
import classNames from 'classnames'

import { useOnUpdate } from '../../hooks'
import ValidationTooltip from '../../validationTooltip'

export const Input = React.forwardRef((props, ref) => {
  const {
    className: classNameProp,
    disabled,
    id,
    inputType,
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

  const handleValueChange = useCallback(
    (newValue) => {
      const input = inputRef.current
      if (selectionAllowed) {
        selectionRef.current = [input.selectionStart, input.selectionEnd]
      }
      if (onChange) {
        onChange(textTransformFunction(newValue))
      }
    },
    [onChange]
  )

  const onChangeEvent = useCallback((event) => handleValueChange(event.target.value), [handleValueChange])

  const onFormattedValueChange = useCallback(
    ({ formattedValue }) => formattedValue !== valueText && handleValueChange(formattedValue),
    [valueText, handleValueChange]
  )

  useOnUpdate(() => {
    if (selectionAllowed) {
      const input = inputRef.current
      ;[input.selectionStart, input.selectionEnd] = selectionRef.current
    }
  }, [value])

  const className = classNames('form-input', classNameProp)

  return (
    <ValidationTooltip key={`validation-${id}`} validation={validation} className="form-input-container">
      {numberFormat ? (
        <NumberFormat
          autoComplete="off"
          disabled={disabled}
          className={className}
          getInputRef={(el) => {
            inputRef.current = el
          }}
          id={id}
          data-testid={id}
          onValueChange={onFormattedValueChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          readOnly={readOnly}
          title={title}
          type={type}
          value={value}
          {...numberFormat}
        />
      ) : (
        React.createElement(inputType, {
          ref: inputRef,
          'aria-disabled': disabled,
          autoComplete: 'off',
          className,
          'data-testid': id,
          disabled,
          id,
          maxLength,
          onBlur,
          onChange: onChangeEvent,
          onFocus,
          placeholder,
          readOnly,
          rows: inputType === 'textarea' ? 4 : null,
          title,
          type,
          value,
        })
      )}
    </ValidationTooltip>
  )
})

Input.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  inputType: PropTypes.oneOf(['input', 'textarea']),
  maxLength: PropTypes.number,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  title: PropTypes.string,
  type: PropTypes.oneOf(['text', 'number', 'password']),
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
  className: null,
  disabled: false,
  id: null,
  inputType: 'input',
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
