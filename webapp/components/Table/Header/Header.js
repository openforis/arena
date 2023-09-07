import React from 'react'
import PropTypes from 'prop-types'

const Header = (props) => {
  const { headerLeftComponent, headerProps } = props

  return <div className="table__header">{React.createElement(headerLeftComponent, { ...props, ...headerProps })}</div>
}

Header.propTypes = {
  count: PropTypes.number.isRequired,
  headerLeftComponent: PropTypes.elementType.isRequired,
  headerProps: PropTypes.object,
  limit: PropTypes.number.isRequired,
  list: PropTypes.array.isRequired,
  offset: PropTypes.number.isRequired,
}

Header.defaultProps = {
  headerProps: {},
}

export default Header
