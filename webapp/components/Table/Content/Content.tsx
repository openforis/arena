import React, { useRef, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import LoadingBar from '@webapp/components/LoadingBar'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'
import { ContentRowCells } from './ContentRowCells'
import { ContentHeaders } from './ContentHeaders'
import { ContentRow } from './ContentRow'

// placeholder rows have no identity: give them positional ids
const getLoadingRowIds = (rows) => Array.from({ length: rows }, (_item, index) => `loading-row-${index}`)

const LoadingRows = ({ rows }) => (
  <div className="table__rows">
    {getLoadingRowIds(rows).map((rowId) => (
      <div className="table__row" key={rowId}>
        <LoadingBar />
      </div>
    ))}
  </div>
)

LoadingRows.propTypes = {
  rows: PropTypes.number.isRequired,
}

// default props as constants: new objects at every render would re-render all the (memoized) rows
const emptyProps = {}

const getGridTemplateColumnsFromColumns = ({ columns, expandableRows }) =>
  [...(expandableRows ? ['40px'] : []), ...columns.map((column) => column.width || '1fr')].join(' ')

const Content = (props) => {
  const {
    cellProps,
    cellTestIdExtractor,
    columns,
    deselectAllItems,
    expandableRows = false,
    gridTemplateColumns: gridTemplateColumnsParam,
    handleSortBy,
    initData,
    isRowActive,
    isRowExpandable,
    isRowOpenable,
    keyExtractor,
    list,
    loading = false,
    maxRows,
    module,
    noItemsLabelKey,
    noItemsLabelForSearchKey,
    offset,
    onItemSelectToggle,
    onRowOpen,
    rowExpandedComponent = null,
    rowComponent: rowComponentParam,
    rowHeaderComponent: rowHeaderComponentParam,
    rowProps = emptyProps,
    selectable = false,
    selectedItems = [],
    selectAllItems,
    sort,
    totalCount = undefined,
    allVisibleItemsSelected,
  } = props

  const i18n = useI18n()

  const tableRef = useRef(null)
  const headerRef = useRef(null)

  const onRowsScroll = useCallback((event) => {
    const header = headerRef.current
    if (!header) return
    header.scrollLeft = event?.target?.scrollLeft
  }, [])

  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.scrollTop = 0
    }
  }, [offset, tableRef])

  if (!loading && A.isEmpty(list)) {
    return (
      <div className="table__empty-rows" data-testid={TestId.table.noItems}>
        {Number(totalCount) <= 0 ? i18n.t(noItemsLabelKey) : i18n.t(noItemsLabelForSearchKey)}
      </div>
    )
  }

  const selectedItemsCount = selectedItems.length
  const selectedKeys = new Set(selectedItems.map((selectedItem) => keyExtractor({ item: selectedItem })))

  const hasColumns = columns?.length > 0
  // components must not be created inline: React would remount all the rows at every render
  const rowComponent = hasColumns ? ContentRowCells : rowComponentParam

  const gridTemplateColumns = hasColumns
    ? getGridTemplateColumnsFromColumns({ columns, expandableRows })
    : gridTemplateColumnsParam

  return (
    <div className="table__content">
      <div className="table__row-header" ref={headerRef} style={{ gridTemplateColumns }}>
        {hasColumns ? (
          <ContentHeaders
            allVisibleItemsSelected={allVisibleItemsSelected}
            columns={columns}
            deselectAllItems={deselectAllItems}
            expandableRows={expandableRows}
            handleSortBy={handleSortBy}
            selectAllItems={selectAllItems}
            selectedItemsCount={selectedItemsCount}
            sort={sort}
            totalCount={totalCount}
          />
        ) : (
          React.createElement(rowHeaderComponentParam, { sort, handleSortBy, ...rowProps })
        )}
      </div>

      {loading ? (
        <LoadingRows rows={maxRows} />
      ) : (
        <div className="table__rows" data-testid={TestId.table.rows(module)} onScroll={onRowsScroll} ref={tableRef}>
          {list.map((item, index) => {
            const key = keyExtractor({ item })
            return (
              <ContentRow
                key={key}
                cellProps={cellProps}
                cellTestIdExtractor={cellTestIdExtractor}
                columns={columns}
                expandableRows={expandableRows}
                gridTemplateColumns={gridTemplateColumns}
                index={index}
                initData={initData}
                isRowActive={isRowActive}
                isRowExpandable={isRowExpandable}
                isRowOpenable={isRowOpenable}
                item={item}
                module={module}
                offset={offset}
                onItemSelectToggle={onItemSelectToggle}
                onRowOpen={onRowOpen}
                rowComponent={rowComponent}
                rowExpandedComponent={rowExpandedComponent}
                rowProps={rowProps}
                selectable={selectable}
                selected={selectedKeys.has(key)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

Content.propTypes = {
  cellProps: PropTypes.object,
  cellTestIdExtractor: PropTypes.func,
  columns: PropTypes.array,
  deselectAllItems: PropTypes.func,
  expandableRows: PropTypes.bool,
  gridTemplateColumns: PropTypes.string.isRequired,
  handleSortBy: PropTypes.func.isRequired,
  isRowActive: PropTypes.func,
  keyExtractor: PropTypes.func.isRequired,
  list: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  maxRows: PropTypes.number.isRequired,
  module: PropTypes.string.isRequired,
  noItemsLabelKey: PropTypes.string.isRequired,
  noItemsLabelForSearchKey: PropTypes.string.isRequired,
  offset: PropTypes.number.isRequired,
  isRowExpandable: PropTypes.func,
  isRowOpenable: PropTypes.func,
  onItemSelectToggle: PropTypes.func.isRequired,
  onRowOpen: PropTypes.func,
  initData: PropTypes.func,
  rowHeaderComponent: PropTypes.elementType.isRequired,
  rowComponent: PropTypes.elementType.isRequired,
  rowExpandedComponent: PropTypes.elementType,
  rowProps: PropTypes.object,
  selectable: PropTypes.bool,
  selectedItems: PropTypes.array,
  selectAllItems: PropTypes.func,
  sort: PropTypes.object.isRequired,
  totalCount: PropTypes.number,
  allVisibleItemsSelected: PropTypes.bool,
}

export default Content
