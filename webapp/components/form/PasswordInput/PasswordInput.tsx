import './PasswordInput.scss'

import React, { useState } from 'react'
import classNames from 'classnames'

import { Button } from '../../buttons'
import { SimpleTextInput, type SimpleTextInputProps } from '../SimpleTextInput'

export type PasswordInputProps = Omit<SimpleTextInputProps, 'type' | 'endAdornment'>

/**
 * Text input of a password, with a button that shows or hides it.
 * @param {PasswordInputProps} props - The props of SimpleTextInput, except the type and the end adornment.
 * @returns {React.ReactElement} The input.
 */
export const PasswordInput = (props: PasswordInputProps) => {
  const { className } = props

  const [passwordShown, setPasswordShown] = useState(false)

  const onMouseDownPasswordVisibility = (event: React.MouseEvent) => {
    event.preventDefault()
  }

  const onClickPasswordVisibility = () => setPasswordShown(!passwordShown)

  const iconClassName = passwordShown ? 'icon-eye' : 'icon-eye-blocked'

  return (
    <SimpleTextInput
      {...props}
      className={classNames('input-password', className)}
      type={passwordShown ? 'text' : 'password'}
      endAdornment={
        <Button onClick={onClickPasswordVisibility} onMouseDown={onMouseDownPasswordVisibility} variant="text">
          <span className={classNames('icon', iconClassName)} />
        </Button>
      }
    />
  )
}

export default PasswordInput
