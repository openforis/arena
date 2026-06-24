import '../form.scss'

import React, { useCallback, useRef } from 'react'
import { NumericFormat, OnValueChange } from 'react-number-format'
import classNames from 'classnames'
import { TextField } from '@mui/material'

import { Objects } from '@openforis/arena-core'
import type { ValidationInstance } from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'

import { useOnUpdate } from '../../hooks'
import ValidationTooltip from '../../validationTooltip'
import { SimpleTextInput } from '../SimpleTextInput'

type NumberFormatProps = {
  decimalScale?: number
  decimalSeparator?: string
  format?: string | ((value: string) => string)
  maxLength?: number
  placeholder?: string
}

type Props = {
  autoFocus?: boolean
  className?: string
  disabled?: boolean
  id?: string
  inputType?: 'input' | 'textarea'
  label?: string
  maxLength?: number
  name?: string
  numberFormat?: NumberFormatProps
  onChange?: (value: string) => void
  onFocus?: React.FocusEventHandler<HTMLInputElement>
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  placeholder?: string
  readOnly?: boolean
  textAreaRows?: number
  textTransformFunction?: (value: string) => string
  title?: string | number
  type?: 'text' | 'number' | 'password'
  validation?: ValidationInstance | null
  value?: string | number
}

export const Input = React.forwardRef<HTMLDivElement, Props>((props, ref) => {
  const {
    autoFocus,
    className: classNameProp = null,
    disabled = false,
    id = null,
    inputType = 'input',
    label = undefined,
    maxLength = null,
    name = undefined,
    numberFormat = null,
    onChange = null,
    onFocus = undefined,
    onBlur = undefined,
    placeholder: placeholderProp = null,
    readOnly = false,
    textAreaRows = 3,
    textTransformFunction = undefined,
    title: titleProp = null,
    type = 'text',
    validation = null,
    value = '',
  } = props

  const i18n = useI18n()

  // workaround for inputRef: useRef(ref) does not work as expected
  const inputRefInternal = useRef<HTMLInputElement | null>(null)
  const inputRef = (ref as React.MutableRefObject<HTMLInputElement | null>) ?? inputRefInternal
  const selectionAllowed = type === 'text'
  const selectionInitial =
    Objects.isNotEmpty(value) && selectionAllowed ? [String(value).length, String(value).length] : []
  const selectionRef = useRef<number[]>(selectionInitial)
  const valueTextOrUndefined = Objects.isEmpty(value) ? undefined : String(value)
  const valueText = valueTextOrUndefined ?? ''
  const title = titleProp ?? valueTextOrUndefined

  const handleValueChange = useCallback(
    (newValue: string) => {
      if (disabled) return

      const input = inputRef.current
      if (selectionAllowed && input) {
        selectionRef.current = [
          (input as HTMLInputElement).selectionStart ?? 0,
          (input as HTMLInputElement).selectionEnd ?? 0,
        ]
      }
      if (onChange) {
        onChange(textTransformFunction ? textTransformFunction(newValue) : newValue)
      }
    },
    [disabled, inputRef, onChange, selectionAllowed, textTransformFunction]
  )

  const onFormattedValueChange = useCallback<OnValueChange>(
    ({ formattedValue }) => formattedValue !== valueText && handleValueChange(formattedValue),
    [valueText, handleValueChange]
  )

  useOnUpdate(() => {
    if (!selectionAllowed) return
    const input = inputRef.current
    if (!input) {
      return
    }
    ;[input.selectionStart, input.selectionEnd] = selectionRef.current
  }, [selectionAllowed, value])

  const className = classNames('form-input', classNameProp)
  const rows = inputType === 'textarea' ? textAreaRows : undefined
  const placeholder = placeholderProp ? i18n.t(placeholderProp) : placeholderProp

  return (
    <ValidationTooltip key={`validation-${id}`} validation={validation} className="form-input-container">
      {numberFormat ? (
        <NumericFormat
          autoComplete="off"
          autoFocus={autoFocus}
          disabled={disabled || readOnly}
          className={className}
          customInput={TextField}
          getInputRef={(el: HTMLInputElement) => {
            inputRef.current = el
          }}
          id={id ?? undefined}
          name={name}
          onBlur={onBlur}
          onFocus={onFocus}
          onValueChange={onFormattedValueChange}
          placeholder={placeholder ?? undefined}
          slotProps={{ htmlInput: { 'data-testid': id } }}
          title={title === undefined ? undefined : String(title)}
          type={type === 'number' ? undefined : type}
          value={value}
          {...numberFormat}
        />
      ) : (
        <SimpleTextInput
          autoComplete="off"
          autoFocus={autoFocus}
          className={className}
          disabled={disabled}
          id={id ?? undefined}
          label={label}
          maxLength={maxLength ?? undefined}
          name={name}
          onBlur={onBlur}
          onChange={handleValueChange}
          onFocus={onFocus}
          placeholder={placeholderProp ?? undefined}
          readOnly={readOnly}
          ref={inputRef}
          rows={rows}
          testId={id ?? undefined}
          title={title}
          type={type}
          value={value}
        />
      )}
    </ValidationTooltip>
  )
})

Input.displayName = 'Input'
