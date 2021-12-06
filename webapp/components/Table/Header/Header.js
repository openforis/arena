import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useNavigate } from 'react-router'

import { updateQuery } from '@webapp/components/Table/tableLink'

import Paginator from './Paginator'

const Header = (props) => {
  const { headerLeftComponent, headerProps, list, offset, limit, count } = props

  const navigate = useNavigate()

  return (
    <div className="table__header">
      {React.createElement(headerLeftComponent, { ...props, ...headerProps })}

      {!R.isEmpty(list) && (
        <Paginator
          offset={offset}
          limit={limit}
          count={count}
          setLimit={(limitUpdated) => updateQuery(navigate)({ limit: limitUpdated })}
          setOffset={(offsetUpdated) => updateQuery(navigate)({ offset: offsetUpdated })}
        />
      )}
    </div>
  )
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
