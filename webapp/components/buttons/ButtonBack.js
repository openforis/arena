import React from 'react'
import { useHistory } from 'react-router'

import { Button } from './Button'

export const ButtonBack = (props) => {
  const { className = '' } = props

  const history = useHistory()

  return <Button onClick={history.goBack} {...props} className={`btn-secondary btn-back ${className}`} />
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
