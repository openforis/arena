import React from 'react'
import PropTypes from 'prop-types'

const ButtonToggle = ({ open, onClick }) => (
  <button type="button" className="btn-s labels-editor__btn-toggle" onClick={onClick}>
    <span className={`icon icon-${open ? 'shrink2' : 'enlarge2'} icon-12px`} />
  </button>
)

ButtonToggle.propTypes = {
  onClick: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
}

export default ButtonToggle
