import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { TextField as MuiTextField } from '@mui/material'
import classNames from 'classnames'

export const TextInput = (props) => {
  const {
    className,
    defaultValue,
    id,
    label,
    startAdornment,
    endAdornment,
    onChange: onChangeProp,
    placeholder,
    textTransformFunction,
    type,
    value,
  } = props

  const onChange = useCallback(
    (e) => {
      const value = e.target.value
      const valueTransformed = textTransformFunction ? textTransformFunction(value) : value
      onChangeProp(valueTransformed)
    },
    [onChangeProp, textTransformFunction]
  )

  return (
    <MuiTextField
      className={classNames('input-text', className)}
      defaultValue={defaultValue}
      label={label}
      id={id}
      InputProps={{
        startAdornment,
        endAdornment,
      }}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      value={value}
    />
  )
}

TextInput.propTypes = {
  className: PropTypes.string,
  defaultValue: PropTypes.string,
  id: PropTypes.string,
  label: PropTypes.string,
  startAdornment: PropTypes.any,
  endAdornment: PropTypes.any,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  textTransformFunction: PropTypes.func,
  type: PropTypes.string,
  value: PropTypes.string,
}
