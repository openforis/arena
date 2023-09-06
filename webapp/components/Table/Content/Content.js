import React, { useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

import * as R from 'ramda'

import LoadingBar from '@webapp/components/LoadingBar'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'
import { ContentRowCells } from './ContentRowCells'
import { ContentHeaders } from './ContentHeaders'
import { ContentRow } from './ContentRow'

const LoadingRows = ({ rows }) => (
  <div className="table__rows">
    {new Array(rows).fill(0).map((_item, index) => (
      <div className="table__row" key={String(index)}>
        <LoadingBar />
      </div>
    ))}
  </div>
)

LoadingRows.propTypes = {
  rows: PropTypes.number.isRequired,
}

const Content = (props) => {
  const {
    columns,
    expandableRows,
    gridTemplateColumns: gridTemplateColumnsParam,
    keyExtractor,
    handleSortBy,
    list,
    loading,
    maxRows,
    module,
    noItemsLabelKey,
    noItemsLabelForSearchKey,
    offset,
    onRowClick,
    onRowDoubleClick,
    totalCount,
    rowHeaderComponent: rowHeaderComponentParam,
    rowComponent: rowComponentParam,
    rowExpandedComponent,
    rowProps,
    selectedItems,
    sort,
  } = props

  const i18n = useI18n()

  const tableRef = useRef(null)

  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.scrollTop = 0
    }
  }, [offset, tableRef])

  if (!loading && R.isEmpty(list)) {
    return (
      <div className="table__empty-rows" data-testid={TestId.table.noItems}>
        {Number(totalCount) <= 0 ? i18n.t(noItemsLabelKey) : i18n.t(noItemsLabelForSearchKey)}
      </div>
    )
  }

  const hasColumns = columns?.length > 0
  const rowComponent = hasColumns
    ? (_props) => <ContentRowCells {..._props} columns={columns} itemSelected={_props.selected} />
    : rowComponentParam

  const rowHeaderComponent = hasColumns
    ? (_props) => <ContentHeaders {..._props} columns={columns} />
    : rowHeaderComponentParam

  const gridTemplateColumns = hasColumns
    ? [...columns.map((column) => column.width || '1fr'), ...(expandableRows ? ['40px'] : [])].join(' ')
    : gridTemplateColumnsParam

  return (
    <div className="table__content">
      <div className="table__row-header" style={{ gridTemplateColumns }}>
        {/* TODO check why props is passed in this way*/}
        {React.createElement(rowHeaderComponent, { props, sort, handleSortBy, ...rowProps })}
      </div>

      {loading ? (
        <LoadingRows rows={maxRows} />
      ) : (
        <div className="table__rows" data-testid={TestId.table.rows(module)} ref={tableRef}>
          {list.map((item, index) => {
            const key = keyExtractor({ item })
            return React.createElement(ContentRow, {
              ...props,
              ...rowProps,
              key,
              row: item, // TODO do not pass "row" but "item" instead
              index,
              item,
              rowComponent,
              rowExpandedComponent,
              gridTemplateColumns,
              onRowClick,
              onRowDoubleClick,
              selected: Boolean(selectedItems.find((_item) => keyExtractor({ item: _item }) === key)),
            })
          })}
        </div>
      )}
    </div>
  )
}

Content.propTypes = {
  columns: PropTypes.array,
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
  onRowClick: PropTypes.func,
  onRowDoubleClick: PropTypes.func,
  initData: PropTypes.func,
  rowHeaderComponent: PropTypes.elementType.isRequired,
  rowComponent: PropTypes.elementType.isRequired,
  rowExpandedComponent: PropTypes.elementType,
  rowProps: PropTypes.object,
  selectedItems: PropTypes.array,
  sort: PropTypes.object.isRequired,
  totalCount: PropTypes.number,
}

Content.defaultProps = {
  columns: null,
  expandableRows: false,
  isRowActive: null,
  onRowClick: null,
  onRowDoubleClick: null,
  initData: null,
  loading: false,
  rowExpandedComponent: null,
  rowProps: {},
  selectedItems: [],
  totalCount: undefined,
}

export default Content
