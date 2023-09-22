import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { TextField as MuiTextField } from '@mui/material'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'

export const TextInput = (props) => {
  const {
    autoComplete,
    className,
    defaultValue,
    disabled,
    endAdornment,
    id,
    label: labelProp,
    name,
    onChange: onChangeProp,
    placeholder: placeholderProp,
    readOnly,
    startAdornment,
    textTransformFunction,
    type,
    value,
  } = props

  const i18n = useI18n()

  const onChange = useCallback(
    (e) => {
      const value = e.target.value
      const valueTransformed = textTransformFunction ? textTransformFunction(value) : value
      onChangeProp(valueTransformed)
    },
    [onChangeProp, textTransformFunction]
  )

  const label = labelProp ? i18n.t(labelProp) : labelProp
  const placeholder = placeholderProp ? i18n.t(placeholderProp) : placeholderProp

  return (
    <MuiTextField
      autoComplete={autoComplete}
      className={classNames('input-text', className)}
      defaultValue={defaultValue}
      label={label}
      id={id}
      InputProps={{
        startAdornment,
        endAdornment,
      }}
      name={name}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled || readOnly}
      type={type}
      value={value}
    />
  )
}

TextInput.propTypes = {
  autoComplete: PropTypes.string,
  className: PropTypes.string,
  defaultValue: PropTypes.string,
  disabled: PropTypes.bool,
  endAdornment: PropTypes.any,
  id: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  startAdornment: PropTypes.any,
  textTransformFunction: PropTypes.func,
  type: PropTypes.string,
  value: PropTypes.string,
}

TextInput.defaultProps = {
  autoComplete: 'off',
}
