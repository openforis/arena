import React, { forwardRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import { TextField as MuiTextField } from '@mui/material'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'

export const SimpleTextInput = forwardRef((props, ref) => {
  const {
    autoComplete,
    className,
    defaultValue,
    disabled,
    endAdornment,
    id,
    inputRef,
    label: labelProp,
    maxLength,
    name,
    onBlur,
    onChange: onChangeProp,
    onFocus,
    placeholder: placeholderProp,
    readOnly,
    rows,
    startAdornment,
    testId,
    textTransformFunction,
    title,
    type,
    value,
  } = props

  const i18n = useI18n()

  const onChange = useCallback(
    (e) => {
      const value = e.target.value
      let valueTransformed = textTransformFunction ? textTransformFunction(value) : value
      if (valueTransformed && maxLength > 0) {
        valueTransformed = valueTransformed.substring(0, maxLength)
      }
      onChangeProp(valueTransformed)
    },
    [maxLength, onChangeProp, textTransformFunction]
  )

  const label = labelProp ? i18n.t(labelProp) : labelProp
  const placeholder = placeholderProp ? i18n.t(placeholderProp) : placeholderProp
  const multiline = rows > 1

  return (
    <MuiTextField
      autoComplete={autoComplete}
      className={classNames('input-text', className)}
      defaultValue={defaultValue}
      disabled={disabled || readOnly}
      label={label}
      id={id}
      inputRef={inputRef}
      InputProps={{
        'data-testid': testId,
        startAdornment,
        endAdornment,
      }}
      margin="none"
      multiline={multiline}
      name={name}
      onBlur={onBlur}
      onChange={onChange}
      onFocus={onFocus}
      placeholder={placeholder}
      ref={ref}
      rows={rows}
      title={title}
      type={type}
      value={value}
    />
  )
})

SimpleTextInput.propTypes = {
  autoComplete: PropTypes.string,
  className: PropTypes.string,
  defaultValue: PropTypes.string,
  disabled: PropTypes.bool,
  endAdornment: PropTypes.any,
  id: PropTypes.string,
  inputRef: PropTypes.any,
  label: PropTypes.string,
  maxLength: PropTypes.number,
  name: PropTypes.string,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  rows: PropTypes.number,
  startAdornment: PropTypes.any,
  testId: PropTypes.string,
  textTransformFunction: PropTypes.func,
  title: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string,
}

SimpleTextInput.defaultProps = {
  autoComplete: 'off',
}
