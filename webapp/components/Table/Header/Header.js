import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Paginator from './Paginator'

const Header = (props) => {
  const { headerLeftComponent, list, offset, limit, count } = props

  return (
    <div className="table__header">
      {React.createElement(headerLeftComponent, props)}

      {!R.isEmpty(list) && <Paginator offset={offset} limit={limit} count={count} />}
    </div>
  )
}

Header.propTypes = {
  count: PropTypes.number.isRequired,
  headerLeftComponent: PropTypes.elementType.isRequired,
  limit: PropTypes.number.isRequired,
  list: PropTypes.array.isRequired,
  offset: PropTypes.number.isRequired,
}

export default Header
