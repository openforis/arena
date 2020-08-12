import '../form.scss'

import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import { TextMask, InputAdapter } from 'react-text-mask-hoc'

import { useOnUpdate } from '../../hooks'
import ValidationTooltip from '../../validationTooltip'

export const Input = React.forwardRef((props, ref) => {
  const {
    disabled,
    id,
    maxLength,
    mask,
    onChange,
    onFocus,
    placeholder,
    placeholderChar,
    readOnly,
    showMask,
    validation,
    value,
  } = props

  const inputRef = useRef(ref)
  const selectionRef = useRef([value.length, value.length])

  const handleChange = (event) => {
    const input = event.target
    const newValue = input.value
    if (value !== newValue) {
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
      {mask ? (
        <TextMask
          ref={inputRef}
          aria-disabled={disabled}
          className="form-input"
          Component={InputAdapter}
          disabled={disabled}
          id={id}
          isControlled
          mask={mask}
          onChange={handleChange}
          onFocus={onFocus}
          placeholder={placeholder}
          placeholderChar={placeholderChar}
          readOnly={readOnly}
          showMask={showMask}
          value={value}
        />
      ) : (
        <input
          ref={inputRef}
          aria-disabled={disabled}
          className="form-input"
          disabled={disabled}
          id={id}
          maxLength={maxLength}
          onChange={handleChange}
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
  // Input mask props
  mask: PropTypes.oneOfType([PropTypes.array, PropTypes.string, PropTypes.func, PropTypes.bool]),
  placeholderChar: PropTypes.string,
  showMask: PropTypes.bool,
}

Input.defaultProps = {
  disabled: false,
  id: null,
  maxLength: null,
  onChange: null,
  onFocus: null,
  placeholder: null,
  readOnly: false,
  validation: null,
  value: '',
  // Input mask props
  mask: false,
  placeholderChar: '\u2000',
  showMask: true,
}
