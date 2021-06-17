import React from 'react'
import PropTypes from 'prop-types'

import { Button } from './Button'

export const ButtonSave = (props) => {
  const { onClick } = props

  return (
    <Button
      className="btn-primary"
      iconClassName="icon-floppy-disk icon-left icon-12px"
      label="common.save"
      onClick={onClick}
    />
  )
}

ButtonSave.propTypes = {
  onClick: PropTypes.func.isRequired,
}
