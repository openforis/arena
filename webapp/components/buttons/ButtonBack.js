import React from 'react'
import { useNavigate } from 'react-router'
import classNames from 'classnames'

import { Button } from './Button'

export const ButtonBack = (props) => {
  const { className, label = 'common.back', ...otherProps } = props

  const navigate = useNavigate()

  return (
    <Button
      {...otherProps}
      className={classNames('btn-secondary btn-back', className)}
      label={label}
      onClick={() => navigate(-1)}
      variant="outlined"
    />
  )
}

// onClick prop is not required in ButtonBack
/* eslint-disable no-unused-vars */
const { onClick, ...otherButtonPropTypes } = Button.propTypes

ButtonBack.propTypes = {
  ...otherButtonPropTypes,
}
