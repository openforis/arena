import React from 'react'
import { useHistory } from 'react-router'

import { Button } from './Button'

export const ButtonBack = (props) => {
  const { className = '' } = props

  const history = useHistory()

  return (
    <Button
      {...props}
      className={`btn-secondary btn-back ${className}`}
      label="common.back"
      onClick={() => history.goBack()}
    />
  )
}

ButtonBack.propTypes = {
  ...Button.propTypes,
}

ButtonBack.defaultProps = {
  ...Button.defaultProps,
}
