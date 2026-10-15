import './PasswordInput.scss'

import React, { useState } from 'react'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'

import { Button } from '../../buttons'
import { SimpleTextInput, type SimpleTextInputProps } from '../SimpleTextInput'

export type PasswordInputProps = Omit<SimpleTextInputProps, 'type' | 'endAdornment' | 'inputAttributes'> & {
  // data-* attributes go to the <input> (for example the hints that keep password managers away)
  [attribute: `data-${string}`]: string | undefined
}

/**
 * Returns the data-* attributes of the props.
 * @param {PasswordInputProps} props - The props.
 * @returns {Record<string, string>} The attributes with a value.
 */
const getDataAttributes = (props: PasswordInputProps): Record<string, string> =>
  Object.fromEntries(
    Object.entries(props).filter(([key, value]) => key.startsWith('data-') && typeof value === 'string')
  ) as Record<string, string>

/**
 * Text input of a password, with a button that shows or hides it.
 * @param {PasswordInputProps} props - The props of SimpleTextInput, except the type and the end adornment.
 * @returns {React.ReactElement} The input.
 */
export const PasswordInput = (props: PasswordInputProps) => {
  const { className } = props
  const i18n = useI18n()

  const [passwordShown, setPasswordShown] = useState(false)

  const onMouseDownPasswordVisibility = (event: React.MouseEvent) => {
    event.preventDefault()
  }

  const onClickPasswordVisibility = () => setPasswordShown(!passwordShown)

  const iconClassName = passwordShown ? 'icon-eye' : 'icon-eye-blocked'

  return (
    <SimpleTextInput
      {...props}
      inputAttributes={getDataAttributes(props)}
      className={classNames('input-password', className)}
      type={passwordShown ? 'text' : 'password'}
      endAdornment={
        <Button
          aria-label={i18n.t(passwordShown ? 'common.hideValue' : 'common.showValue')}
          aria-pressed={passwordShown}
          onClick={onClickPasswordVisibility}
          onMouseDown={onMouseDownPasswordVisibility}
          variant="text"
        >
          <span className={classNames('icon', iconClassName)} />
        </Button>
      }
    />
  )
}

export default PasswordInput
