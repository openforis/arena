import '../form.scss'

import React, { useCallback, useRef } from 'react'
import { NumericFormat } from 'react-number-format'
import classNames from 'classnames'
import { TextField } from '@mui/material'
import PropTypes from 'prop-types'

import { Strings } from '@openforis/arena-core'

import { useOnUpdate } from '../../hooks'
import ValidationTooltip from '../../validationTooltip'
import { SimpleTextInput } from '../SimpleTextInput'

const textAreaRows = 3

export const Input = React.forwardRef((props, ref) => {
  const {
    className: classNameProp = null,
    disabled = false,
    id = null,
    inputType = 'input',
    maxLength = null,
    name = undefined,
    numberFormat = null,
    onChange = null,
    onFocus = () => {},
    onBlur = () => {},
    placeholder = null,
    readOnly = false,
    textTransformFunction = (s) => s,
    title: titleProp = null, // defaults to value
    type = 'text',
    validation = null,
    value = '',
  } = props

  // workaround for inputRef: useRef(ref) does not work as expected
  const inputRefInternal = useRef(null)
  const inputRef = ref ?? inputRefInternal
  const selectionAllowed = type === 'text'
  const selectionInitial = selectionAllowed ? [value.length, value.length] : null
  const selectionRef = useRef(selectionInitial)
  const valueText = Strings.defaultIfEmpty('')(value)
  const title = titleProp ?? valueText

  const handleValueChange = useCallback(
    (newValue) => {
      if (disabled) return

      const input = inputRef.current
      if (selectionAllowed) {
        selectionRef.current = [input.selectionStart, input.selectionEnd]
      }
      if (onChange) {
        onChange(textTransformFunction(newValue))
      }
    },
    [disabled, inputRef, onChange, selectionAllowed, textTransformFunction]
  )

  const onFormattedValueChange = useCallback(
    ({ formattedValue }) => formattedValue !== valueText && handleValueChange(formattedValue),
    [valueText, handleValueChange]
  )

  useOnUpdate(() => {
    if (!selectionAllowed) return
    const input = inputRef.current
    ;[input.selectionStart, input.selectionEnd] = selectionRef.current
  }, [selectionAllowed, value])

  const className = classNames('form-input', classNameProp)
  const rows = inputType === 'textarea' ? textAreaRows : undefined

  return (
    <ValidationTooltip key={`validation-${id}`} validation={validation} className="form-input-container">
      {numberFormat ? (
        <NumericFormat
          autoComplete="off"
          disabled={disabled || readOnly}
          className={className}
          customInput={TextField}
          getInputRef={(el) => {
            inputRef.current = el
          }}
          id={id}
          data-testid={id}
          name={name}
          onValueChange={onFormattedValueChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          title={title}
          type={type}
          value={value}
          {...numberFormat}
        />
      ) : (
        <SimpleTextInput
          autoComplete="off"
          className={className}
          disabled={disabled}
          id={id}
          inputRef={inputRef}
          maxLength={maxLength}
          name={name}
          onBlur={onBlur}
          onChange={handleValueChange}
          onFocus={onFocus}
          placeholder={placeholder}
          readOnly={readOnly}
          rows={rows}
          testId={id}
          title={title}
          type={type}
          value={value}
        />
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
  name: PropTypes.string,
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
