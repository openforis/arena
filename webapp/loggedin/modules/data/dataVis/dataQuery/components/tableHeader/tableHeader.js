import './tableHeader.scss'
import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import Paginator from './Paginator'

import ButtonDownload from './buttonDownload'
import ButtonFilter from './buttonFilter'
import ButtonSort from './buttonSort'
import { updateTableOffset, toggleTableModeEdit, toggleTableModeAggregate, toggleNodeDefsSelector } from '../../actions'

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
    data,
    hasData,
    hasTableAndCols,
    editMode,
    aggregateMode,
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
          <button
            type="button"
            className={`btn btn-s btn-edit${aggregateMode ? ' highlight' : ''}`}
            onClick={() => dispatch(toggleTableModeAggregate())}
            aria-disabled={appSaving || editMode}
          >
            <span className="icon icon-sigma icon-14px" />
          </button>
          {canEdit && hasTableAndCols && (
            <button
              type="button"
              className={`btn btn-s btn-edit${editMode ? ' highlight' : ''}`}
              onClick={() => dispatch(toggleTableModeEdit())}
              aria-disabled={appSaving || aggregateMode || !hasData}
            >
              <span className="icon icon-pencil2 icon-14px" />
            </button>
          )}
        </div>

        {hasTableAndCols && (
          <div>
            <ButtonFilter editMode={editMode} filter={filter} nodeDefUuidContext={nodeDefUuidContext} />
            <ButtonSort
              nodeDefUuidContext={nodeDefUuidContext}
              nodeDefUuidCols={nodeDefUuidCols}
              sort={sort}
              disabled={editMode || !hasData}
            />
            <ButtonDownload
              filter={filter}
              nodeDefUuidContext={nodeDefUuidContext}
              nodeDefUuidCols={nodeDefUuidCols}
              sort={sort}
              disabled={editMode || !hasData}
            />
          </div>
        )}
      </div>

      {data && hasData && (
        <Paginator
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
  nodeDefUuidContext: PropTypes.string,
  nodeDefUuidCols: PropTypes.arrayOf(String).isRequired,
  filter: PropTypes.object,
  sort: PropTypes.arrayOf(Object).isRequired,
  limit: PropTypes.number,
  offset: PropTypes.number,
  count: PropTypes.number,
  data: PropTypes.array,
  hasData: PropTypes.bool.isRequired,
  hasTableAndCols: PropTypes.bool.isRequired,
  editMode: PropTypes.bool.isRequired,
  aggregateMode: PropTypes.bool.isRequired,
  nodeDefSelectorsVisible: PropTypes.bool.isRequired,
}

TableHeader.defaultProps = {
  nodeDefUuidContext: null,
  filter: null,
  limit: null,
  offset: null,
  count: null,
  data: null,
}

export default TableHeader
