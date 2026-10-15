import React, { forwardRef, useCallback } from 'react'
import { TextField as MuiTextField } from '@mui/material'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'

import { translatePlaceholder } from './translatePlaceholder'

export type SimpleTextInputProps = {
  autoComplete?: string
  autoFocus?: boolean
  className?: string
  defaultValue?: string
  disabled?: boolean
  endAdornment?: React.ReactNode
  id?: string
  // attributes of the <input> element, such as data-* hints for password managers
  inputAttributes?: Record<string, string>
  label?: string
  maxLength?: number
  name?: string
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  onChange?: (value: string) => void
  onFocus?: React.FocusEventHandler<HTMLInputElement>
  placeholder?: string
  readOnly?: boolean
  rows?: number
  startAdornment?: React.ReactNode
  testId?: string
  textTransformFunction?: (value: string) => string
  title?: string | number
  type?: string
  value?: string | number
}

export const SimpleTextInput = forwardRef<HTMLDivElement, SimpleTextInputProps>((props, ref) => {
  const {
    autoComplete = 'off',
    autoFocus,
    className,
    defaultValue,
    disabled,
    endAdornment,
    id,
    inputAttributes,
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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      let valueTransformed = textTransformFunction ? textTransformFunction(val) : val
      if (valueTransformed && maxLength && maxLength > 0) {
        valueTransformed = valueTransformed.substring(0, maxLength)
      }
      onChangeProp?.(valueTransformed)
    },
    [maxLength, onChangeProp, textTransformFunction]
  )

  const label = labelProp ? i18n.t(labelProp) : labelProp
  const placeholder = translatePlaceholder(i18n, placeholderProp)
  const multiline = rows !== undefined && rows > 1

  return (
    <MuiTextField
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      className={classNames('input-text', className)}
      defaultValue={defaultValue}
      disabled={disabled || readOnly}
      label={label}
      id={id}
      slotProps={{ input: { startAdornment, endAdornment }, htmlInput: { ...inputAttributes, 'data-testid': testId } }}
      inputRef={ref}
      margin="none"
      multiline={multiline}
      name={name}
      onBlur={onBlur}
      onChange={onChange}
      onFocus={onFocus}
      placeholder={placeholder}
      rows={rows}
      title={title === undefined ? undefined : String(title)}
      type={type}
      value={value}
    />
  )
})

SimpleTextInput.displayName = 'SimpleTextInput'
