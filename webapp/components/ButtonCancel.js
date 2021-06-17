import React from 'react'
import PropTypes from 'prop-types'

import { Button } from './Button'

export const ButtonCancel = (props) => {
  const { onClick } = props

  return <Button className="btn-secondary" label="common.cancel" onClick={onClick} />
}

ButtonCancel.propTypes = {
  onClick: PropTypes.func.isRequired,
}
