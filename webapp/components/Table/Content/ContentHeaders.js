import React from 'react'

import { ContentHeader } from './ContentHeader'

export const ContentHeaders = (props) => {
  const { columns, deselectAllItems, handleSortBy, selectedItemsCount, selectAllItems, sort, totalCount } = props

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
    />
  ))
}
