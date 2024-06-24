import './PasswordInput.scss'

import React, { useState } from 'react'
import classNames from 'classnames'

import { Button } from '../../buttons'
import { SimpleTextInput } from '../SimpleTextInput'

export const PasswordInput = (props) => {
  const { className } = props

  const [passwordShown, setPasswordShown] = useState(false)

  const onMouseDownPasswordVisibility = (event) => {
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

PasswordInput.propTypes = {
  ...SimpleTextInput.propTypes,
}

PasswordInput.defaultProps = {
  ...SimpleTextInput.defaultProps,
}

export default PasswordInput
