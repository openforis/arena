import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import ExpressionComponent from '../../../../../commonComponents/expression/expression'
import TablePaginator from '../../../../../commonComponents/table/tablePaginator'
import SortEditor from './sort/sortEditor'

import { updateTableFilter, updateTableOffset, updateTableSort } from '../actions'

import Expression from '../../../../../../common/exprParser/expression'

const TableHeader = props => {

  const {
    nodeDefUuidContext, nodeDefUuidCols,
    filter, sort, limit, offset, count,
    updateTableFilter, updateTableOffset, updateTableSort,
    showPaginator,
  } = props

  return (
    <div className="table__header">

      <div className="data-operations">

        <div className="filter-container">
          {
            nodeDefUuidContext &&
            <React.Fragment>
              <span className="icon icon-filter icon-14px icon-left icon-reverse btn-of"
                    style={{ opacity: R.isEmpty(filter) ? 0.5 : 1 }}/>
              <ExpressionComponent
                nodeDefUuidContext={nodeDefUuidContext}
                query={filter}
                onChange={updateTableFilter}
                mode={Expression.modes.sql}/>
            </React.Fragment>
          }
        </div>

        <div className="sort-container">
          {
            nodeDefUuidContext &&
            <React.Fragment>
              <span className="icon icon-sort-amount-asc icon-14px icon-left icon-reverse btn-of"
                    style={{ opacity: R.isEmpty(filter) ? 0.5 : 1 }}/>
              <SortEditor
                nodeDefUuidCols={nodeDefUuidCols}
                nodeDefUuidContext={nodeDefUuidContext}
                sort={sort}
                onChange={updateTableSort}/>
            </React.Fragment>
          }
        </div>
      </div>

      {
        showPaginator &&
        <TablePaginator
          offset={offset}
          limit={limit}
          count={count}
          fetchFn={updateTableOffset}
        />
      }

    </div>
  )
}

TableHeader.defaultProps = {
  nodeDefUuidContext: null,
  nodeDefUuidCols: null,
  filter: null,
  sort: null,
  limit: null,
  offset: null,
  count: null,
  updateTableFilter: null,
  updateTableOffset: null,
  updateTableSort: null,
  showPaginator: false,
}

export default connect(
  null,
  { updateTableOffset, updateTableFilter, updateTableSort }
)(TableHeader)