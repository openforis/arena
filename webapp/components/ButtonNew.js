import React from 'react'
import PropTypes from 'prop-types'

import { Button } from './Button'

export const ButtonNew = (props) => {
  const { onClick } = props

  return (
    <Button
      className="btn-primary"
      iconClassName="icon-plus icon-12px icon-left"
      label="common.new"
      onClick={onClick}
    />
  )
}

ButtonNew.propTypes = {
  onClick: PropTypes.func.isRequired,
}
