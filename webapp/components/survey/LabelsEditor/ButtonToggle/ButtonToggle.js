import React from 'react'
import PropTypes from 'prop-types'

import { Button } from '@webapp/components/buttons'

const ButtonToggle = ({ open, onClick }) => (
  <Button
    className="btn-s labels-editor__btn-toggle"
    iconClassName={`icon icon-${open ? 'shrink2' : 'enlarge2'} icon-12px`}
    onClick={onClick}
    variant="text"
  />
)

ButtonToggle.propTypes = {
  onClick: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
}

export default ButtonToggle
