import React from 'react'
import { connect } from 'react-redux'

import ExpressionEditorPopup from '../../../../../commonComponents/expression/expressionEditorPopup'
import TablePaginator from '../../../../../commonComponents/table/tablePaginator'
import SortEditor from './sort/sortEditor'

import Expression from '../../../../../../common/exprParser/expression'

import { updateTableFilter, updateTableOffset, updateTableSort } from '../actions'

class TableHeader extends React.Component {

  constructor (props) {
    super(props)

    this.toggleExpressionEditor = this.toggleExpressionEditor.bind(this)
    this.toggleSortEditor = this.toggleSortEditor.bind(this)

    this.state = {
      showExpressionEditor: false,
      showSortEditor: false,
    }
  }

  toggleExpressionEditor () {
    this.setState(state => ({
        showExpressionEditor: !state.showExpressionEditor,
        showSortEditor: false,
    }))
  }

  toggleSortEditor () {
    this.setState(state => ({
      showExpressionEditor: false,
      showSortEditor: !state.showSortEditor,
    }))
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

        <div className="data-operations">
          <button className={`btn btn-s btn-of-light btn-edit${filter ? ' highlight' : ''}`}
                  onClick={this.toggleExpressionEditor}>
            <span className="icon icon-filter icon-14px"/>
          </button>
          {
            showExpressionEditor &&
            <ExpressionEditorPopup
              nodeDefUuidContext={nodeDefUuidContext}
              query={filter}
              mode={Expression.modes.sql}
              onChange={query => {
                updateTableFilter(query)
                this.toggleExpressionEditor()
              }}
              onClose={this.toggleExpressionEditor}
            />

          }

          <button className={`btn btn-s btn-of-light btn-edit${sort ? ' highlight' : ''}`}
                  onClick={this.toggleSortEditor}>
            <span className="icon icon-sort-amount-asc icon-14px"/>
          </button>
          {
            showSortEditor &&
            <SortEditor
              nodeDefUuidCols={nodeDefUuidCols}
              nodeDefUuidContext={nodeDefUuidContext}
              sort={sort}
              onChange={updateTableSort}
              onClose={this.toggleSortEditor}/>

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