import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useHistory } from 'react-router'

import { updateQuery } from '@webapp/components/Table/tableLink'

import Paginator from './Paginator'

const Header = (props) => {
  const { headerLeftComponent, headerProps, list, offset, limit, count } = props

  const history = useHistory()

  return (
    <div className="table__header">
      {React.createElement(headerLeftComponent, { ...props, ...headerProps })}

      {!R.isEmpty(list) && (
        <Paginator
          offset={offset}
          limit={limit}
          count={count}
          setLimit={(limitUpdated) => updateQuery(history)({ value: limitUpdated, key: 'limit' })}
          setOffset={(offsetUpdated) => updateQuery(history)({ value: offsetUpdated, key: 'offset' })}
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
