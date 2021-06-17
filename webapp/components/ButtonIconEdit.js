import React from 'react'
import PropTypes from 'prop-types'

import { Button } from './Button'

export const ButtonIconEdit = (props) => {
  const { onClick } = props

  return <Button iconClassName="icon-pencil2 icon-14px" onClick={onClick} />
}

ButtonIconEdit.propTypes = {
  onClick: PropTypes.func.isRequired,
}
