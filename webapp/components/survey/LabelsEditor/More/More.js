import React from 'react'
import PropTypes from 'prop-types'

const More = ({ open, onClick }) => (
  <button type="button" className="btn-s btn-toggle-labels" style={{ justifySelf: 'end' }} onClick={onClick}>
    <span className={`icon icon-${open ? 'enlarge2' : 'shrink2'} icon-12px`} />
  </button>
)

More.propTypes = {
  onClick: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
}

export default More
