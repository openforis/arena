import React, { useState } from 'react'
import { connect } from 'react-redux'

import useI18n from '../../../../../../commonComponents/useI18n'

import ExpressionEditorPopup from '../../../../../../commonComponents/expression/expressionEditorPopup'
import TablePaginator from '../../../../../tableViews/components/tablePaginator'
import SortEditor from './sort/sortEditor'
import DownloadButton from '../../../../../../commonComponents/form/downloadButton'
import Tooltip from '../../../../../../commonComponents/tooltip'

import Expression from '../../../../../../../common/exprParser/expression'
import * as DataSort from '../../../../../../../common/surveyRdb/dataSort'

import {
  updateTableFilter,
  resetTableFilter,
  updateTableOffset,
  updateTableSort,
  updateTableEditMode
} from '../actions'

const TableHeader = props => {

  const [showExpressionEditor, setShowExpressionEditor] = useState(false)
  const [showSortEditor, setShowSortEditor] = useState(false)

  const toggleExpressionEditor = () => {
    setShowExpressionEditor(!showExpressionEditor)
    setShowSortEditor(false)
  }

  const toggleSortEditor = () => {
    setShowExpressionEditor(false)
    setShowSortEditor(!showSortEditor)
  }

  const {
    surveyId, nodeDefUuidContext, nodeDefUuidCols,
    tableName, colNames, filter, sort, limit, offset, count,
    showPaginator, editMode, canEdit,
    updateTableFilter, updateTableOffset, updateTableEditMode,
    resetTableFilter,
    updateTableSort,
  } = props

  const csvDownloadLink = `/api/surveyRdb/${surveyId}/${tableName}/export?filter=${JSON.stringify(filter)}&sort=${DataSort.toHttpParams(sort)}&cols=${JSON.stringify(colNames)}`

  const i18n = useI18n()
  const sortMsg = DataSort.getViewExpr(i18n.t('data.dataVis.dataSort.ascending'), i18n.t('data.dataVis.dataSort.descending'))(sort)

  return (
    <div className="table__header">

      <div className="data-operations">
        <Tooltip messages={filter && [Expression.toString(filter, Expression.modes.sql)]}>
          <button className={`btn btn-s btn-edit${filter ? ' highlight' : ''}`}
                  onClick={toggleExpressionEditor}>
            <span className="icon icon-filter icon-14px"/>
          </button>
        </Tooltip>
        {
          showExpressionEditor &&
          <ExpressionEditorPopup
            nodeDefUuidContext={nodeDefUuidContext}
            expr={filter}
            mode={Expression.modes.sql}
            onChange={(_, expr) => {
              if (expr) {
                updateTableFilter(expr)
              } else {
                resetTableFilter()
              }
              toggleExpressionEditor()
            }}
            onClose={toggleExpressionEditor}
          />

        }

        <Tooltip messages={sortMsg && [sortMsg]}>
          <button className={`btn btn-s btn-edit${sort.length ? ' highlight' : ''}`}
                  onClick={toggleSortEditor}>
            <span className="icon icon-sort-amount-asc icon-14px"/>
          </button>
        </Tooltip>
        {
          showSortEditor &&
          <SortEditor
            nodeDefUuidCols={nodeDefUuidCols}
            nodeDefUuidContext={nodeDefUuidContext}
            sort={sort}
            onChange={sort => updateTableSort(sort)}
            onClose={toggleSortEditor}/>

        }

        <div>
          <DownloadButton
            href={csvDownloadLink}
            label="CSV"
          />
        </div>

        {
          canEdit &&
          <div>
            <button className={`btn btn-s btn-edit${editMode ? ' highlight' : ''}`}
                    onClick={() => updateTableEditMode(!editMode)}>
              <span className="icon icon-pencil2 icon-14px"/>
            </button>
          </div>
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
  editMode: false,
}

export default connect(
  null,
  { updateTableOffset, resetTableFilter, updateTableFilter, updateTableSort, updateTableEditMode }
)(TableHeader)