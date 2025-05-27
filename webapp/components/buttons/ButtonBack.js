import React from 'react'
import classNames from 'classnames'

import { useNavigator } from '@webapp/app/useNavigator'
import { Button } from './Button'

export const ButtonBack = (props) => {
  const { className, label = 'common.back', ...otherProps } = props

  const { navigateBack } = useNavigator()

  return (
    <Button
      {...otherProps}
      label={label}
      onClick={navigateBack}
      className={classNames('btn-secondary btn-back', className)}
    />
  )
}

// onClick prop is not required in ButtonBack
/* eslint-disable no-unused-vars */
const { onClick, ...otherButtonPropTypes } = Button.propTypes

ButtonBack.propTypes = {
  ...otherButtonPropTypes,
}
