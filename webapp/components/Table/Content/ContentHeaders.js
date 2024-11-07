import React from 'react'
import PropTypes from 'prop-types'

import { ContentHeader } from './ContentHeader'

export const ContentHeaders = (props) => {
  const {
    columns,
    deselectAllItems,
    handleSortBy,
    selectedItemsCount,
    selectAllItems,
    sort,
    totalCount,
    visibleItemsCount,
  } = props

  return columns.map((column) => (
    <ContentHeader
      key={column.key}
      column={column}
      deselectAllItems={deselectAllItems}
      handleSortBy={handleSortBy}
      selectAllItems={selectAllItems}
      selectedItemsCount={selectedItemsCount}
      sort={sort}
      totalCount={totalCount}
      visibleItemsCount={visibleItemsCount}
    />
  ))
}

ContentHeaders.propTypes = {
  columns: PropTypes.array,
  deselectAllItems: PropTypes.func,
  handleSortBy: PropTypes.func,
  selectAllItems: PropTypes.func,
  selectedItemsCount: PropTypes.number,
  sort: PropTypes.object,
  totalCount: PropTypes.number,
  visibleItemsCount: PropTypes.number,
}
