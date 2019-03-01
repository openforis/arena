import React from 'react'
import { connect } from 'react-redux'

import ExpressionComponent from '../../../../../commonComponents/expression/expression'
import TablePaginator from '../../../../../commonComponents/table/tablePaginator'
import BadgeTooltip from '../../../../../commonComponents/badgeTooltip'

import SortEditor from './sort/sortEditor'

import { updateTableFilter, updateTableOffset, updateTableSort } from '../actions'

import Expression from '../../../../../../common/exprParser/expression'

class TableHeader extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      showExpressionEditor: false,
      showSortEditor: false,
    }
  }

  toggleExpressionEditor () {
    this.setState({
      showExpressionEditor: !this.state.showExpressionEdit,
      showSortEditor: false,
    })
  }

  toggleSortEditor () {
    this.setState({
      showSortEditor: !this.state.showSortEditor,
      showExpressionEditor: false,
    })
  }

  render () {

    const { showExpressionEditor, showSortEditor } = this.state

    const {
      nodeDefUuidContext, nodeDefUuidCols,
      filter, sort, limit, offset, count,
      updateTableFilter, updateTableOffset, updateTableSort,
      showPaginator,
    } = this.props

    return (
      <div className="table__header">

        <div className="data-query-tools">
          <button className={`btn btn-s btn-of-light btn-edit${filter ? ' highlight' : ''}`}
                  onClick={() => this.toggleExpressionEditor()}>
            <span className="icon icon-filter icon-14px" />
          </button>
          {
            showExpressionEditor &&
              <ExpressionComponent
                nodeDefUuidContext={nodeDefUuidContext}
                query={filter}
                onChange={updateTableFilter}
                mode={Expression.modes.sql}/>

          }

          <button className={`btn btn-s btn-of-light btn-edit${sort ? ' highlight' : ''}`}
                  onClick={() => this.toggleSortEditor()}>
            <span className="icon icon-sort-amount-asc icon-14px" />
          </button>
          {
            showSortEditor &&
              <SortEditor
                nodeDefUuidCols={nodeDefUuidCols}
                nodeDefUuidContext={nodeDefUuidContext}
                sort={sort}
                onChange={updateTableSort}
                onClose={() => this.toggleSortEditor()} />

          }
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