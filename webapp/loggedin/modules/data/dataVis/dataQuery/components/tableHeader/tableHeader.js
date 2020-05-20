import './tableHeader.scss'
import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import TablePaginator from '@webapp/loggedin/tableViews/components/tablePaginator'

import ButtonDownload from './buttonDownload'
import ButtonFilter from './buttonFilter'
import ButtonSort from './buttonSort'
import { updateTableOffset, updateTableEditMode, toggleNodeDefsSelector } from '../../actions'

const TableHeader = (props) => {
  const {
    appSaving,
    nodeDefUuidContext,
    nodeDefUuidCols,
    filter,
    sort,
    limit,
    offset,
    count,
    nodeDefSelectorsVisible,
    showPaginator,
    editMode,
    canEdit,
  } = props

  const dispatch = useDispatch()

  return (
    <div className="table__header">
      <div className="table__header-button-bar">
        <div>
          <button
            type="button"
            className={`btn btn-s${nodeDefSelectorsVisible ? ' highlight' : ''}`}
            onClick={() => dispatch(toggleNodeDefsSelector())}
          >
            <span className="icon icon-tab icon-14px" />
          </button>
        </div>

        <div>
          <ButtonFilter editMode={editMode} filter={filter} nodeDefUuidContext={nodeDefUuidContext} />
          <ButtonSort
            editMode={editMode}
            nodeDefUuidContext={nodeDefUuidContext}
            nodeDefUuidCols={nodeDefUuidCols}
            sort={sort}
          />
          <ButtonDownload
            editMode={editMode}
            filter={filter}
            nodeDefUuidContext={nodeDefUuidContext}
            nodeDefUuidCols={nodeDefUuidCols}
            sort={sort}
          />
        </div>

        <div>
          {canEdit && (
            <button
              type="button"
              className={`btn btn-s btn-edit${editMode ? ' highlight' : ''}`}
              onClick={() => dispatch(updateTableEditMode(!editMode))}
              aria-disabled={appSaving}
            >
              <span className="icon icon-pencil2 icon-14px" />
            </button>
          )}
          <button
            type="button"
            className={`btn btn-s btn-edit${editMode ? ' highlight' : ''}`}
            onClick={() => {}}
            aria-disabled={appSaving || editMode}
          >
            <span className="icon icon-sigma icon-14px" />
          </button>
        </div>
      </div>

      {showPaginator && (
        <TablePaginator
          offset={offset}
          limit={limit}
          count={count}
          fetchFn={(offsetUpdate) => dispatch(updateTableOffset(offsetUpdate))}
        />
      )}
    </div>
  )
}

TableHeader.propTypes = {
  appSaving: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool.isRequired,
  nodeDefUuidContext: PropTypes.string.isRequired,
  nodeDefUuidCols: PropTypes.arrayOf(String).isRequired,
  filter: PropTypes.object,
  sort: PropTypes.arrayOf(Object).isRequired,
  limit: PropTypes.number,
  offset: PropTypes.number.isRequired,
  count: PropTypes.number,
  showPaginator: PropTypes.bool.isRequired,
  editMode: PropTypes.bool.isRequired,
  nodeDefSelectorsVisible: PropTypes.bool.isRequired,
}

TableHeader.defaultProps = {
  filter: null,
  limit: null,
  count: null,
}

export default TableHeader
