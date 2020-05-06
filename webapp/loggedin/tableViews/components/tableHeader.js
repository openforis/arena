import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import * as R from 'ramda'

import * as TableViewsState from '@webapp/loggedin/tableViews/tableViewsState'
import { fetchListItems } from '@webapp/loggedin/tableViews/actions'

import TablePaginator from './tablePaginator'

const TableHeader = (props) => {
  const { headerLeftComponent, module, apiUri, restParams } = props

  const dispatch = useDispatch()
  const list = useSelector(TableViewsState.getList(module))
  const count = useSelector(TableViewsState.getCount(module))
  const limit = useSelector(TableViewsState.getLimit(module))
  const offset = useSelector(TableViewsState.getOffset(module))

  return (
    <div className="table__header">
      {React.createElement(headerLeftComponent, props)}

      {!R.isEmpty(list) && (
        <TablePaginator
          offset={offset}
          limit={limit}
          count={count}
          fetchFn={(offsetUpdate) => dispatch(fetchListItems(module, apiUri, offsetUpdate, restParams))}
        />
      )}
    </div>
  )
}

TableHeader.propTypes = {
  apiUri: PropTypes.string.isRequired,
  headerLeftComponent: PropTypes.elementType.isRequired,
  module: PropTypes.string.isRequired,
  restParams: PropTypes.object.isRequired,
}

export default TableHeader
