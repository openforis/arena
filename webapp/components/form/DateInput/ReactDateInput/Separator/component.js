import React from 'react'
import PropTypes from 'prop-types'

const Separator = ({ separator }) => <div className="separator">{separator}</div>

Separator.propTypes = {
  separator: PropTypes.string,
}

Separator.defaultProps = {
  separator: '/',
}

export default Separator
