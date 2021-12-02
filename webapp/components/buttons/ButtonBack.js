import React from 'react'
import { useNavigate } from 'react-router'

import { Button } from './Button'

export const ButtonBack = (props) => {
  const { className = '' } = props

  const navigate = useNavigate()

  return <Button onClick={() => navigate.go(-1)} {...props} className={`btn-secondary btn-back ${className}`} />
}

// onClick prop is not required in ButtonBack
const { onClick, ...otherButtonPropTypes } = Button.propTypes

ButtonBack.propTypes = {
  ...otherButtonPropTypes,
}

ButtonBack.defaultProps = {
  ...Button.defaultProps,
  label: 'common.back',
}
