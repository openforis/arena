import React from 'react'

import { ContentHeader } from './ContentHeader'

export const ContentHeaders = (props) => {
  const { columns, handleSortBy, sort } = props

  return (
    <>
      {columns.map((column) => (
        <ContentHeader key={column.key} column={column} handleSortBy={handleSortBy} sort={sort} />
      ))}
    </>
  )
}
