import React from 'react'
import * as R from 'ramda'

import TablePaginator from './tablePaginator'

const TableHeader = props => {

  const {
    module, moduleApiUri,
    headerLeftComponent,
    list, offset, limit, count,
    fetchListItems,

  } = props

  return (
    <div className="table__header">
      {
        React.createElement(headerLeftComponent, props)
      }

      {
        !R.isEmpty(list) &&
        <TablePaginator
          offset={offset}
          limit={limit}
          count={count}
          fetchFn={offset => fetchListItems(module, moduleApiUri, offset)}
        />
      }

    </div>
  )
}

export default TableHeader