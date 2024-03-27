import React from 'react'
import classNames from 'classnames'
import { useNavigate } from 'react-router'

import { Button } from './Button'

export const ButtonBack = (props) => {
  const { className, ...otherProps } = props

  const navigate = useNavigate()

  return (
    <Button {...otherProps} onClick={() => navigate(-1)} className={classNames('btn-secondary btn-back', className)} />
  )
}

// onClick prop is not required in ButtonBack
/* eslint-disable no-unused-vars */
const { onClick, ...otherButtonPropTypes } = Button.propTypes

ButtonBack.propTypes = {
  ...otherButtonPropTypes,
}

ButtonBack.defaultProps = {
  ...Button.defaultProps,
  label: 'common.back',
}
