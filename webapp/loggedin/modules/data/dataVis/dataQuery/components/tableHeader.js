import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import ExpressionEditorPopup from '../../../../../../commonComponents/expression/expressionEditorPopup'
import TablePaginator from '../../../../../../commonComponents/table/tablePaginator'
import SortEditor from './sort/sortEditor'
import DownloadButton from '../../../../../../commonComponents/form/downloadButton'
import Tooltip from '../../../../../../commonComponents/tooltip'

import Expression from '../../../../../../../common/exprParser/expression'
import * as DataSort from './sort/dataSort'

import { updateTableFilter, updateTableOffset, updateTableSort, updateTableEditMode } from '../actions'

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

  updateSort (sort) {
    const { updateTableSort } = this.props

    updateTableSort(sort)
  }

  render () {

    const { showExpressionEditor, showSortEditor } = this.state

    const {
      surveyId, nodeDefUuidContext, nodeDefUuidCols,
      tableName, colNames, filter, sort, limit, offset, count,
      showPaginator, editMode, canEdit,
      updateTableFilter, updateTableOffset, updateTableEditMode,
    } = this.props

    const csvDownloadLink = `/api/surveyRdb/${surveyId}/${tableName}/export?filter=${JSON.stringify(filter)}&sort=${DataSort.serialize(sort)}&cols=${JSON.stringify(colNames)}`
    const sortMsg = DataSort.getViewExpr(sort)

    return (
      <div className="table__header">

        <div className="data-operations">
          <Tooltip messages={filter ? [Expression.toString(filter, Expression.modes.sql)] : []}>
            <button className={`btn btn-s btn-of-light btn-edit${filter ? ' highlight' : ''}`}
                    onClick={this.toggleExpressionEditor}>
              <span className="icon icon-filter icon-16px"/>
            </button>
          </Tooltip>
          {
            showExpressionEditor &&
            <ExpressionEditorPopup
              nodeDefUuidContext={nodeDefUuidContext}
              expr={filter}
              mode={Expression.modes.sql}
              onChange={(_, expr) => {
                updateTableFilter(expr)
                this.toggleExpressionEditor()
              }}
              onClose={this.toggleExpressionEditor}
            />

          }

          <Tooltip messages={sortMsg && [sortMsg]}>
            <button className={`btn btn-s btn-of-light btn-edit${sort.length ? ' highlight' : ''}`}
                    onClick={this.toggleSortEditor}>
              <span className="icon icon-sort-amount-asc icon-16px"/>
            </button>
          </Tooltip>
          {
            showSortEditor &&
            <SortEditor
              nodeDefUuidCols={nodeDefUuidCols}
              nodeDefUuidContext={nodeDefUuidContext}
              sort={sort}
              onChange={(sort) => this.updateSort(sort)}
              onClose={this.toggleSortEditor}/>

          }

          <DownloadButton
            href={csvDownloadLink}
            label="CSV"
          />

          {
            canEdit &&
            <button className={`btn btn-s btn-of-light btn-edit${editMode ? ' highlight' : ''}`}
                    onClick={() => updateTableEditMode(!editMode)}>
              <span className="icon icon-pencil2 icon-16px"/>
            </button>
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
  editMode: false
}

export default connect(
  null,
  { updateTableOffset, updateTableFilter, updateTableSort, updateTableEditMode }
)(TableHeader)